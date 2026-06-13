import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/auth/supabase/middleware";

// Next.js 16 "proxy" convention (formerly "middleware"). Runs on every matched
// request to refresh the Supabase auth session and guard protected routes.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image files so the
     * Supabase session is refreshed on every page/route navigation.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
