import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { db } from "./firebase"
import type { SalesDocument } from "@/types/sales"

export const salesKeys = {
  all: ["sales"] as const,
  realTime: () => [...salesKeys.all, "realTime"] as const,
}

export async function fetchAllSales(): Promise<SalesDocument[]> {
  console.log("[v1] Starting fetchAllSales from flat sales collection")

  try {
    const salesRef = collection(db, "sales")
    const salesQuery = query(salesRef, orderBy("timestamp", "desc"))
    const salesSnapshot = await getDocs(salesQuery)

    const allSales: SalesDocument[] = salesSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        deviceId: data.deviceId || "",
        branchId: data.branchId || "",
        coins_1: data.coins_1 || 0,
        coins_5: data.coins_5 || 0,
        coins_10: data.coins_10 || 0,
        coins_20: data.coins_20 || 0,
        total: data.total || 0,
        timestamp: data.timestamp,
      }
    })

    console.log("[v1] Total sales fetched:", allSales.length)
    return allSales
  } catch (error) {
    console.error("[v1] Error fetching sales:", error)
    throw error
  }
}
