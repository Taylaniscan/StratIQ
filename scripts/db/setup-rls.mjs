/**
 * Idempotent multi-tenancy security setup.
 *
 * Run as the privileged `postgres` role (DIRECT_URL). Creates/updates the
 * dedicated runtime role used by the app (DATABASE_URL), grants it CRUD on the
 * public schema, and enables Postgres RLS with a tenant-isolation policy on every
 * tenant-scoped table.
 *
 * Why a dedicated role: the Supabase `postgres` role has BYPASSRLS and owns the
 * tables, so RLS never applies to it. The app must connect as a NOBYPASSRLS role
 * for RLS to actually enforce. App-layer scoping (lib/db/tenant.ts) is the other
 * line of defense.
 *
 * Re-run any time (e.g. after adding new tenant-scoped tables):
 *   npm run db:setup-rls
 */
import pg from "pg";

const { Client } = pg;

const adminUrl = process.env.DIRECT_URL;
const appUrl = process.env.DATABASE_URL;
if (!adminUrl) throw new Error("DIRECT_URL is not set");
if (!appUrl) throw new Error("DATABASE_URL is not set");

// Derive the app role name + password from DATABASE_URL. The pooler username is
// "<role>.<projectref>"; the actual Postgres role is the part before the dot.
const appParsed = new URL(appUrl);
const appRole = decodeURIComponent(appParsed.username).split(".")[0];
const appPassword = decodeURIComponent(appParsed.password);
if (!appRole || !appPassword) {
  throw new Error("Could not parse app role/password from DATABASE_URL");
}
if (appRole === "postgres") {
  throw new Error("DATABASE_URL still points at 'postgres'; it must use the dedicated app role");
}

// A literal-safe quote for the password (only used in CREATE/ALTER ROLE).
const quoteLiteral = (s) => "'" + s.replace(/'/g, "''") + "'";
// Identifier quoting for table / role names.
const quoteIdent = (s) => '"' + s.replace(/"/g, '""') + '"';

const client = new Client({ connectionString: adminUrl });

async function main() {
  await client.connect();
  const me = await client.query("select current_user");
  console.log("Connected as:", me.rows[0].current_user);

  // 1. Create the dedicated, NON-bypassing app role on first run only. We do NOT
  //    ALTER an existing role: Supabase's `postgres` can CREATE roles but not
  //    ALTER their attributes/password. The script stays idempotent — re-runs are
  //    for (re)applying grants + RLS to new tables. To rotate the password, drop
  //    and recreate the role (or use the Supabase dashboard).
  const existing = await client.query("select 1 from pg_roles where rolname = $1", [appRole]);
  if (existing.rowCount === 0) {
    await client.query(
      `CREATE ROLE ${quoteIdent(appRole)} LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD ${quoteLiteral(appPassword)}`,
    );
    console.log(`Created role ${appRole}`);
  } else {
    console.log(`Role ${appRole} already exists — leaving attributes/password unchanged`);
  }

  // 2. Grants on the public schema (current + future objects).
  const r = quoteIdent(appRole);
  await client.query(`GRANT USAGE ON SCHEMA public TO ${r}`);
  await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${r}`);
  await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${r}`);
  await client.query(
    `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${r}`,
  );
  await client.query(
    `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${r}`,
  );
  console.log("Granted CRUD + default privileges on public");

  // 3. Discover tenant-scoped tables: anything in public with a `tenant_id`
  //    column, plus `tenants` itself (scoped by its own id).
  const cols = await client.query(`
    select table_name
    from information_schema.columns
    where table_schema = 'public' and column_name = 'tenant_id'
  `);
  const scoped = cols.rows.map((row) => ({ table: row.table_name, col: "tenant_id" }));

  const hasTenants = await client.query(`
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'tenants'
  `);
  if (hasTenants.rowCount > 0) scoped.push({ table: "tenants", col: "id" });

  // 4. Enable RLS + (re)create the tenant-isolation policy on each.
  for (const { table, col } of scoped) {
    const t = quoteIdent(table);
    const c = quoteIdent(col);
    await client.query(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE public.${t} FORCE ROW LEVEL SECURITY`);
    await client.query(`DROP POLICY IF EXISTS tenant_isolation ON public.${t}`);
    await client.query(
      `CREATE POLICY tenant_isolation ON public.${t}
         USING (${c} = current_setting('app.tenant_id', true))
         WITH CHECK (${c} = current_setting('app.tenant_id', true))`,
    );
    console.log(`RLS enabled + tenant_isolation policy on public.${table} (${col})`);
  }

  console.log("\nDone. RLS is enforced for role:", appRole);
}

main()
  .catch((err) => {
    console.error("setup-rls failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
