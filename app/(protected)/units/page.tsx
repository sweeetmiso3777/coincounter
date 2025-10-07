import { Button } from "@/components/ui/button";
import { UnitsPageCards } from "@/components/Unit/units-card";
import { ArrowLeft, Info } from "lucide-react";
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
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground font-mono">
              Branch harvest only counts sales from assigned devices.
            </p>
            <div className="group relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md shadow-lg border w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                When a Branch harvest happens, it scans all the units assigned
                to it and only counts the daily sales documents that contains
                its ID. Click the{" "}
                <p className="text-blue-700 font-mono">View Details</p> to know
                which daily sales are under which Branch.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
              </div>
            </div>
          </div>
        </div>
        <UnitsPageCards />
      </div>
    </main>
  );
}
