import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Phase 0 · Foundation
          </p>
          <CardTitle className="text-3xl">StratIQ</CardTitle>
          <CardDescription>
            Adaptive procurement category sourcing strategy platform. The
            scaffold is live — next comes the Adaptivity Engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Next.js · TypeScript · Tailwind · shadcn/ui are wired up. Database,
            auth, and the capability resolver land in the tasks that follow.
          </p>
        </CardContent>
        <CardFooter className="gap-3">
          <Button>Get started</Button>
          <Button
            variant="outline"
            render={
              <a
                href="https://github.com/Taylaniscan/StratIQ"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            View repo
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
