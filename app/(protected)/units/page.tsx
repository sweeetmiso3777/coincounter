import { UnitsTable } from "@/components/Unit/units-page";

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Device Management</h1>
          <p className="text-muted-foreground">
            View and manage all units from your Firestore collection.
          </p>
        </div>
        <UnitsTable />
      </div>
    </main>
  );
}
