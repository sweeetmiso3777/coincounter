import admin from "firebase-admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface Aggregate {
  coins_1: number;
  coins_5: number;
  coins_10: number;
  coins_20: number;
  total: number;
  sales_count: number;
  branchId: string;
  timestamp: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
  harvested: boolean;
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)
    ),
  });
}

const db = admin.firestore();

function getManilaDate(date?: Date) {
  const now = date || new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
}

function getDateId(date: Date) {
  return date.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  const cronKey = request.headers.get("x-cron-key");
  if (cronKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized: Invalid cron key" }, { status: 401 });
  }

  try {
    const today = getManilaDate();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const todayDateId = getDateId(today);
    const currentTimestamp = admin.firestore.Timestamp.now();

    // Fetch all units first to create deviceId -> branchId mapping
    const unitsSnapshot = await db.collection("Units").get();
    const branchMap: Record<string, string> = {};
    
    unitsSnapshot.forEach(doc => {
      branchMap[doc.id] = doc.data().branchId || "unknown";
    });

    // Query all sales for today
    const salesSnapshot = await db.collection("sales")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
      .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
      .get();

    const deviceAggregates: Record<string, Aggregate> = {};

    // PHASE 1: Create aggregates (don't delete sales yet)
    const aggregateBatch = db.batch();
    
    // Process sales and create aggregates
    salesSnapshot.forEach(doc => {
      const data = doc.data();
      const deviceId = data.deviceId;
      const branchId = branchMap[deviceId] || "unknown";

      if (!deviceAggregates[deviceId]) {
        deviceAggregates[deviceId] = {
          coins_1: 0,
          coins_5: 0,
          coins_10: 0,
          coins_20: 0,
          total: 0,
          sales_count: 0,
          branchId: branchId,
          timestamp: currentTimestamp,
          createdAt: currentTimestamp,
          harvested: false
        };
      }

      // Aggregate totals
      deviceAggregates[deviceId].coins_1 += data.coins_1 || 0;
      deviceAggregates[deviceId].coins_5 += data.coins_5 || 0;
      deviceAggregates[deviceId].coins_10 += data.coins_10 || 0;
      deviceAggregates[deviceId].coins_20 += data.coins_20 || 0;
      deviceAggregates[deviceId].total += data.total || 0;
      deviceAggregates[deviceId].sales_count += 1;
    });

    // Write per-device aggregates 
    for (const [deviceId, agg] of Object.entries(deviceAggregates)) {
      const aggRef = db.collection("Units").doc(deviceId).collection("aggregates").doc(todayDateId);
      aggregateBatch.set(aggRef, agg, { merge: true });
    }

    // COMMIT AGGREGATES FIRST
    await aggregateBatch.commit();

    // PHASE 2: Only delete sales if aggregates were successful
    const deleteBatch = db.batch();
    salesSnapshot.forEach(doc => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();

    return NextResponse.json({
      success: true,
      message: "done",
      summary: {
        totalUnits: unitsSnapshot.size,
        activeUnitsToday: Object.keys(deviceAggregates).length,
        salesProcessed: salesSnapshot.size,
        salesDeleted: salesSnapshot.size,
        branchCoverage: Object.keys(branchMap).length,
        processedAt: currentTimestamp.toDate().toISOString()
      }
    });
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: (err as Error).message,
      note: "No sales were deleted due to the error above"
    }, { status: 500 });
  }
}