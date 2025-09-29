import BranchPageClient from "./page-client";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Branch Details",
  description: "View and manage details for a specific branch.",
};
export default function BranchPage() {
  return <BranchPageClient />;
}
