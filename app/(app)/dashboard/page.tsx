import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/auth/supabase/server";

import { signout } from "../../(auth)/login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders: middleware already guards this route, but never render
  // protected content without a verified user.
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Authenticated
          </p>
          <CardTitle className="text-2xl">Dashboard</CardTitle>
          <CardDescription>
            You are signed in. This is a placeholder — the category workspace
            arrives in Phase 1.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{user.email}</dd>
            <dt className="text-muted-foreground">User ID</dt>
            <dd className="font-mono text-xs break-all">{user.id}</dd>
          </dl>
        </CardContent>
        <CardFooter>
          <form action={signout}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
