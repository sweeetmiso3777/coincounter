import { type NextRequest, NextResponse } from "next/server"
import { collection, getDocs, query, where, Timestamp, writeBatch, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Aggregate {
  total: number
  coins_1: number
  coins_5: number
  coins_10: number
  coins_20: number
  sales_count: number
}

interface HarvestResult {
  totalHarvested: number
  coins_1: number
  coins_5: number
  coins_10: number
  coins_20: number
  sales_count: number
  documentsUpdated: number
  harvestDate: Date
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, key } = body


    const apiKey = process.env.HARVEST_API_KEY
    if (!key || key !== apiKey) {
      return NextResponse.json({ error: "Unauthorized: Invalid API key" }, { status: 401 })
    }

    console.log("[v0] Harvest request for deviceId:", deviceId)

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    const aggregatesCol = collection(db, "Units", deviceId, "aggregates")

    const q = query(aggregatesCol, where("harvested", "==", false))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return NextResponse.json({ error: "No unharvested aggregates found" }, { status: 404 })
    }

    const harvestResult: HarvestResult = {
      totalHarvested: 0,
      coins_1: 0,
      coins_5: 0,
      coins_10: 0,
      coins_20: 0,
      sales_count: 0,
      documentsUpdated: snapshot.docs.length,
      harvestDate: new Date(),
    }

    const batch = writeBatch(db)

    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data() as Aggregate

      harvestResult.totalHarvested += data.total || 0
      harvestResult.coins_1 += data.coins_1 || 0
      harvestResult.coins_5 += data.coins_5 || 0
      harvestResult.coins_10 += data.coins_10 || 0
      harvestResult.coins_20 += data.coins_20 || 0
      harvestResult.sales_count += data.sales_count || 0

      const docRef = doc(db, "Units", deviceId, "aggregates", docSnapshot.id)
      batch.update(docRef, {
        harvested: true,
        harvestedAt: Timestamp.fromDate(new Date()),
      })
    })

    await batch.commit()

    return NextResponse.json(harvestResult)
  } catch (error) {
    console.error("[v0] Harvest failed:", error)
    return NextResponse.json(
      {
        error: "Failed to harvest aggregates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
