import { BranchPage } from "@/components/Branch/branch-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Branches",
  description: "View Your Branch Records.",
};

export default function BranchesPage() {
  return (
    <main className="min-h-screen bg-background">
      <BranchPage />
    </main>
  );
}
