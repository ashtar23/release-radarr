import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";

import { ModeToggle } from "@/components/mode-toggle";
import { AuthCard } from "@/features/auth";
import { SearchPanel } from "@/features/search";

export function SearchPage() {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <ModeToggle />
        <Card>
          <CardHeader>
            <CardTitle>Release Radar</CardTitle>
            <CardDescription>
              Guest browsing stays open. Watchlist and notifications require
              auth.
            </CardDescription>
          </CardHeader>
        </Card>

        <SearchPanel />
        <AuthCard />
      </div>
    </main>
  );
}
