import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Branch, BranchData } from "@/types/branch"

// Fetch all branches
export async function fetchBranches(): Promise<BranchData[]> {
  try {
    const branchesRef = collection(db, "Branches")
    const q = query(branchesRef, orderBy("created_at", "desc"))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<Branch, "id">
      return {
        id: doc.id,
        branch_manager: data.branch_manager,
        created_at: data.created_at?.toDate() || new Date(),
        harvest_day_of_month: data.harvest_day_of_month || 1,
        location: data.location,
        share: data.share,
      }
    })
  } catch (error) {
    console.error("Error fetching branches:", error)
    throw new Error("Failed to fetch branches")
  }
}

// Fetch single branch
export async function fetchBranch(id: string): Promise<BranchData> {
  try {
    const branchRef = doc(db, "Branches", id)
    const snapshot = await getDoc(branchRef)

    if (!snapshot.exists()) {
      throw new Error(`Branch with ID "${id}" does not exist`)
    }

    const data = snapshot.data() as Omit<Branch, "id">
    return {
      id: snapshot.id,
      branch_manager: data.branch_manager,
      created_at: data.created_at?.toDate() || new Date(),
      harvest_day_of_month: data.harvest_day_of_month || 1,
      location: data.location,
      share: data.share,
    }
  } catch (error) {
    console.error("Error fetching branch:", error)
    throw error
  }
}

// Create new branch
export async function createBranch(branchData: Omit<BranchData, "id" | "created_at">): Promise<string> {
  try {
    const branchesRef = collection(db, "Branches")
    const docRef = await addDoc(branchesRef, {
      ...branchData,
      created_at: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating branch:", error)
    throw new Error("Failed to create branch")
  }
}

// Update branch
export async function updateBranch(
  id: string,
  branchData: Partial<Omit<BranchData, "id" | "created_at">>,
): Promise<void> {
  try {
    const branchRef = doc(db, "Branches", id)

    // Check if branch exists
    const snapshot = await getDoc(branchRef)
    if (!snapshot.exists()) {
      throw new Error(`Branch with ID "${id}" does not exist`)
    }

    await updateDoc(branchRef, branchData)
  } catch (error) {
    console.error("Error updating branch:", error)
    throw error
  }
}

// Delete branch
export async function deleteBranch(id: string): Promise<void> {
  try {
    const branchRef = doc(db, "Branches", id)

    // Check if branch exists
    const snapshot = await getDoc(branchRef)
    if (!snapshot.exists()) {
      throw new Error(`Branch with ID "${id}" does not exist`)
    }

    await deleteDoc(branchRef)
  } catch (error) {
    console.error("Error deleting branch:", error)
    throw error
  }
}

// Real-time subscription helper
export function subscribeToBranches(callback: (branches: BranchData[]) => void): () => void {
  const branchesRef = collection(db, "Branches")
  const q = query(branchesRef, orderBy("created_at", "desc"))

  return onSnapshot(
    q,
    (snapshot) => {
      const branches: BranchData[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Branch, "id">
        return {
          id: doc.id,
          branch_manager: data.branch_manager,
          created_at: data.created_at?.toDate() || new Date(),
          harvest_day_of_month: data.harvest_day_of_month || 1,
          location: data.location,
          share: data.share,
        }
      })
      callback(branches)
    },
    (error) => {
      console.error("Error in branches subscription:", error)
      throw error
    },
  )
}
