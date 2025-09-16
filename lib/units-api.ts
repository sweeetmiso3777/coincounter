import { db } from "./firebase"
import { collection, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore"
import type { Unit } from "@/types/unit"
import type { Branch } from "@/types/branch"

export interface UnitWithBranch {
  id: string
  deviceId: string
  branchId: string
  branchName: string
}

// Fetch all units
export async function fetchUnits(): Promise<Unit[]> {
  try {
    console.log("[v0] Fetching units from Firebase...")
    const unitsRef = collection(db, "Units")
    console.log("[v0] Units collection reference:", unitsRef)

    const snapshot = await getDocs(unitsRef)
    console.log("[v0] Snapshot received:", snapshot)
    console.log("[v0] Snapshot size:", snapshot.size)
    console.log("[v0] Snapshot empty:", snapshot.empty)

    const units = snapshot.docs.map((doc) => {
      console.log("[v0] Processing doc:", doc.id, doc.data())
      return {
        id: doc.id,
        ...doc.data(),
      }
    }) as Unit[]

    console.log("[v0] Mapped units:", units)
    return units
  } catch (error) {
    console.error("[v0] Error fetching units:", error)
    throw error
  }
}

// Fetch branch by ID
export async function fetchBranchById(branchId: string): Promise<Branch | null> {
  try {
    const branchRef = doc(db, "Branches", branchId)
    const branchSnap = await getDoc(branchRef)

    if (branchSnap.exists()) {
      return {
        id: branchSnap.id,
        ...branchSnap.data(),
      } as Branch
    }
    return null
  } catch (error) {
    console.error("Error fetching branch:", error)
    return null
  }
}

export async function fetchUnitsWithBranch(): Promise<UnitWithBranch[]> {
  try {
    console.log("[v0] Starting fetchUnitsWithBranch...")
    const units = await fetchUnits()
    console.log("[v0] Units returned from fetchUnits:", units)

    if (!units || units.length === 0) {
      console.log("[v0] No units found!")
      return []
    }

    const unitsWithData: UnitWithBranch[] = []

    for (const unit of units) {
      console.log("[v0] Processing unit:", unit)

      // Fetch branch name
      const branch = await fetchBranchById(unit.branch)
      console.log("[v0] Fetched branch:", branch)

      const branchName = branch?.location || "Unknown Branch"

      unitsWithData.push({
        id: unit.id, // This is the deviceId from ESP32
        deviceId: unit.id, // Document ID is the deviceId
        branchId: unit.branch,
        branchName,
      })
    }

    console.log("[v0] Final units with data:", unitsWithData)
    return unitsWithData
  } catch (error) {
    console.error("[v0] Error in fetchUnitsWithBranch:", error)
    throw error
  }
}

// Real-time subscription for units
export function subscribeToUnits(callback: (units: Unit[]) => void) {
  const unitsRef = collection(db, "Units")

  return onSnapshot(
    unitsRef,
    (snapshot) => {
      const units = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Unit[]

      callback(units)
    },
    (error) => {
      console.error("Error in units subscription:", error)
    },
  )
}
