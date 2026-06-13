import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            StratIQ
          </p>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Use your email and password. New here? Create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p
              role="alert"
              className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
          {notice ? (
            <p
              role="status"
              className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
            >
              {notice}
            </p>
          ) : null}

          <form className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={6}
                required
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" formAction={login} className="flex-1">
                Sign in
              </Button>
              <Button
                type="submit"
                formAction={signup}
                variant="outline"
                className="flex-1"
              >
                Sign up
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
