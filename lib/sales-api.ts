import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import type { SalesDocument } from "@/types/sales"

export async function fetchSalesByDay(dateKey: string): Promise<SalesDocument[]> {
  try {
    console.log(`[v0] Fetching sales for date: ${dateKey}`)

    // Create start and end of day in local time (which matches Firestore's UTC+8 storage)
    const [year, month, day] = dateKey.split("-").map(Number)

    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)

    console.log(`[v0] Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`)
    console.log(`[v0] Local times: ${startOfDay.toLocaleString()} to ${endOfDay.toLocaleString()}`)

    const startTimestamp = Timestamp.fromDate(startOfDay)
    const endTimestamp = Timestamp.fromDate(endOfDay)

    const q = query(
      collection(db, "sales"),
      where("timestamp", ">=", startTimestamp),
      where("timestamp", "<=", endTimestamp),
      orderBy("timestamp", "desc"),
    )

    const querySnapshot = await getDocs(q)
    const sales: SalesDocument[] = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as SalesDocument,
    )

    console.log(`[v0] 📊 Query returned ${sales.length} sales for ${dateKey}`)
    return sales
  } catch (error) {
    console.error("Error fetching sales by day:", error)
    throw new Error("Failed to fetch sales data")
  }
}
