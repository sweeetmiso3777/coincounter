import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "./firebase"
import type { SalesDocument } from "@/types/sales"

function getDayBounds(day: string) {
  // Construct explicit local PH timezone dates
  const start = new Date(`${day}T00:00:00+08:00`)
  const end = new Date(`${day}T23:59:59+08:00`)
  return { start, end }
}

export async function fetchSalesByDay(day: string): Promise<SalesDocument[]> {
  try {
    const { start, end } = getDayBounds(day)


    const q = query(
      collection(db, "sales"),
      where("timestamp", ">=", start),
      where("timestamp", "<=", end),
      orderBy("timestamp", "desc")
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SalesDocument))
  } catch (error) {
    console.error("[fetchSalesByDay] Failed:", error)
    return [] // return empty array on error
  }
}
