import { Button } from "@/components/ui/button";
import { UnitsPageCards } from "@/components/Unit/units-card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Units List",
  description: "View All Your Units.",
};

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/branches">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Branches
            </Link>
          </Button>
          <h1 className="text-3xl font-mono text-foreground">
            Device Management
          </h1>
          <p className="text-muted-foreground font-mono">
            View and manage all units from your Firestore collection.
          </p>
        </div>
        <UnitsPageCards />
      </div>
    </main>
  );
}
