import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BranchPageClient from "./page-client";

export async function generateStaticParams() {
  try {
    const branchesCollection = collection(db, "Branches");
    const branchesSnapshot = await getDocs(branchesCollection);

    return branchesSnapshot.docs.map((doc) => ({
      branchId: doc.id,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default function BranchPage() {
  return <BranchPageClient />;
}
