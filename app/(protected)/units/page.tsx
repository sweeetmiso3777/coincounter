import { UnitsTable } from "@/components/Unit/units-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Units List",
  description: "View All Your Units.",
};

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-mono text-foreground">
            Device Management
          </h1>
          <p className="text-muted-foreground font-mono">
            View and manage all units from your Firestore collection.
          </p>
        </div>
        <UnitsTable />
      </div>
    </main>
  );
}
