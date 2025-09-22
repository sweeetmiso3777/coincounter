import { onSchedule } from "firebase-functions/v2/scheduler"
import * as admin from "firebase-admin"

admin.initializeApp()

export const aggregateAllSales = onSchedule(
  {
    schedule: "49 23 * * *", // every 11:59 PM Manila
    timeZone: "Asia/Manila",
  },
  async () => {
    const db = admin.firestore()
    try {
      // --- 1. Compute Manila start/end of today ---
      const now = new Date()
      const manilaNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }))
      const start = new Date(manilaNow.getFullYear(), manilaNow.getMonth(), manilaNow.getDate(), 0, 0, 0)
      const end   = new Date(manilaNow.getFullYear(), manilaNow.getMonth(), manilaNow.getDate(), 23, 59, 59, 999)

      const aggregateId = manilaNow
        .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        .toLowerCase()

      console.log(`[v1] Aggregating sales for ${aggregateId}`)

      // --- 2. Build device → branch map ---
      const deviceSnap = await db.collection("devices").get()
      const deviceBranchMap = new Map<string, string>()
      deviceSnap.forEach((doc) => {
        const d = doc.data()
        if (d.branchId) deviceBranchMap.set(doc.id, d.branchId)
      })
      console.log(`[v1] Loaded ${deviceBranchMap.size} devices for branch lookup`)

      // --- 3. Fetch today's sales ---
      const salesSnap = await db
        .collection("sales")
        .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(start))
        .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(end))
        .get()

      if (salesSnap.empty) {
        console.log(`[v1] No sales found for ${aggregateId}`)
        return
      }

      // --- 4. Aggregate per branch ---
      const branchAggregates = new Map<string, any>()

      salesSnap.forEach((doc) => {
        const data = doc.data()
        const branchId = deviceBranchMap.get(data.deviceId) || "unknown"

        if (!branchAggregates.has(branchId)) {
          branchAggregates.set(branchId, {
            branchId,
            aggregateDate: aggregateId,
            totalTransactions: 0,
            grandTotal: 0,
            coins_1: 0,
            coins_5: 0,
            coins_10: 0,
            coins_20: 0,
            earliest: null as admin.firestore.Timestamp | null,
            latest: null as admin.firestore.Timestamp | null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        }

        const b = branchAggregates.get(branchId)
        b.totalTransactions++
        b.grandTotal += data.total || 0
        b.coins_1 += data.coins_1 || 0
        b.coins_5 += data.coins_5 || 0
        b.coins_10 += data.coins_10 || 0
        b.coins_20 += data.coins_20 || 0

        // normalize timestamp
        let ts: admin.firestore.Timestamp | null = null
        if (data.timestamp?.toDate) {
          ts = data.timestamp
        } else if (data.timestamp?.seconds) {
          ts = new admin.firestore.Timestamp(data.timestamp.seconds, data.timestamp.nanoseconds || 0)
        }

        if (ts) {
          if (!b.earliest || ts.toMillis() < b.earliest.toMillis()) b.earliest = ts
          if (!b.latest || ts.toMillis() > b.latest.toMillis()) b.latest = ts
        }
      })

      // --- 5. Write one aggregate doc per branch ---
      const batch = db.batch()
      branchAggregates.forEach((agg, branchId) => {
        const totalCoins = agg.coins_1 + agg.coins_5 + agg.coins_10 + agg.coins_20
        const ref = db.collection("Branches").doc(branchId)
                      .collection("Aggregates").doc(aggregateId)
        batch.set(ref, {
          ...agg,
          totalCoins,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        console.log(
          `[v1] Branch ${branchId} - ${agg.totalTransactions} txns, ₱${agg.grandTotal}`
        )
      })

      await batch.commit()
      console.log(
        `[v1] ✅ Aggregated ${salesSnap.size} sales across ${branchAggregates.size} branches`
      )
    } catch (err) {
      console.error("[v1] ❌ Error aggregating sales:", err)
      throw err
    }
  }
)
