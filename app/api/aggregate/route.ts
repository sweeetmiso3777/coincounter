import admin from "firebase-admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)
    ),
  });
}

const db = admin.firestore();

function getManilaDate() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
}

export async function GET(request: NextRequest) {
  // Bearer token check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const today = getManilaDate();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0, 0, 0, 0
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23, 59, 59, 999
    );

    // Get all sales from today
    const salesSnapshot = await db.collection("sales")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
      .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
      .get();

    const deviceAggregates: Record<string, {
      coins_1: number,
      coins_5: number,
      coins_10: number,
      coins_20: number,
      total: number,
      sales_count: number
    }> = {};

    salesSnapshot.forEach(doc => {
      const data = doc.data();
      const deviceId = data.deviceId;
      if (!deviceAggregates[deviceId]) {
        deviceAggregates[deviceId] = { coins_1: 0, coins_5: 0, coins_10: 0, coins_20: 0, total: 0, sales_count: 0 };
      }
      deviceAggregates[deviceId].coins_1 += data.coins_1 || 0;
      deviceAggregates[deviceId].coins_5 += data.coins_5 || 0;
      deviceAggregates[deviceId].coins_10 += data.coins_10 || 0;
      deviceAggregates[deviceId].coins_20 += data.coins_20 || 0;
      deviceAggregates[deviceId].total += data.total || 0;
      deviceAggregates[deviceId].sales_count += 1;
    });

    // Write aggregate documents under each device
    const batch = db.batch();
    const dateId = `${today.getFullYear()} ${today.toLocaleString("default", { month: "long" })} ${today.getDate()}`;

    for (const [deviceId, agg] of Object.entries(deviceAggregates)) {
      const aggRef = db.collection("devices").doc(deviceId).collection("aggregates").doc(dateId);
      batch.set(aggRef, { ...agg, timestamp: admin.firestore.Timestamp.fromDate(today) });
    }

    await batch.commit();

    return NextResponse.json({ success: true, message: "Aggregates created", devices: Object.keys(deviceAggregates) });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
