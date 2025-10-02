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
  timestamp: admin.firestore.Timestamp;
}

interface BackupAggregate {
  coins_1: number;
  coins_5: number;
  coins_10: number;
  coins_20: number;
  total: number;
  reasons: string[];
  timestamp: admin.firestore.Timestamp;
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
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    console.log(" STARTING DAILY AGGREGATION PROCESS");
    
    const today = getManilaDate();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const todayDateId = getDateId(today);

    console.log(` Processing date: ${todayDateId}`);
    console.log(` Time range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // --- Step 1: Aggregate Today's Sales ---
    console.log(" Querying today's sales...");
    const salesSnapshot = await db.collection("sales")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
      .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
      .get();

    console.log(` Found ${salesSnapshot.size} sales documents for today`);

    const deviceAggregates: Record<string, Aggregate> = {};
    let totalSalesAmount = 0;
    let totalCoins = {
      coins_1: 0,
      coins_5: 0,
      coins_10: 0,
      coins_20: 0
    };

    salesSnapshot.forEach(doc => {
      const data = doc.data();
      const deviceId = data.deviceId;

      if (!deviceAggregates[deviceId]) {
        deviceAggregates[deviceId] = {
          coins_1: 0,
          coins_5: 0,
          coins_10: 0,
          coins_20: 0,
          total: 0,
          sales_count: 0,
          timestamp: admin.firestore.Timestamp.fromDate(today)
        };
      }

      deviceAggregates[deviceId].coins_1 += data.coins_1 || 0;
      deviceAggregates[deviceId].coins_5 += data.coins_5 || 0;
      deviceAggregates[deviceId].coins_10 += data.coins_10 || 0;
      deviceAggregates[deviceId].coins_20 += data.coins_20 || 0;
      deviceAggregates[deviceId].total += data.total || 0;
      deviceAggregates[deviceId].sales_count += 1;

      // Track overall totals
      totalSalesAmount += data.total || 0;
      totalCoins.coins_1 += data.coins_1 || 0;
      totalCoins.coins_5 += data.coins_5 || 0;
      totalCoins.coins_10 += data.coins_10 || 0;
      totalCoins.coins_20 += data.coins_20 || 0;
    });

    // Log device-specific aggregation results
    console.log(`\n SALES AGGREGATION RESULTS:`);
    console.log(`Devices with sales today: ${Object.keys(deviceAggregates).length}`);
    
    Object.entries(deviceAggregates).forEach(([deviceId, agg]) => {
      console.log(`\n Device: ${deviceId}`);
      console.log(`   • Sales Count: ${agg.sales_count}`);
      console.log(`   • Total Amount: ₱${agg.total}`);
      console.log(`   • Coins Breakdown:`);
      console.log(`     - 1P: ${agg.coins_1} coins`);
      console.log(`     - 5P: ${agg.coins_5} coins`);
      console.log(`     - 10P: ${agg.coins_10} coins`);
      console.log(`     - 20P: ${agg.coins_20} coins`);
    });

    console.log(`\n GRAND TOTALS ACROSS ALL DEVICES:`);
    console.log(`   • Total Sales: ${salesSnapshot.size} transactions`);
    console.log(`   • Total Amount: ₱${totalSalesAmount}`);
    console.log(`   • Total Coins: ${totalCoins.coins_1 + totalCoins.coins_5 + totalCoins.coins_10 + totalCoins.coins_20} coins`);
    console.log(`   • Coin Distribution: 1P(${totalCoins.coins_1}) 5P(${totalCoins.coins_5}) 10P(${totalCoins.coins_10}) 20P(${totalCoins.coins_20})`);

    // --- Step 2: Write Aggregates ---
    console.log(`\n Writing aggregates to Firestore...`);
    const batchAggregates = db.batch();
    const aggregateWrites = [];

    for (const [deviceId, agg] of Object.entries(deviceAggregates)) {
      const aggRef = db.collection("Units").doc(deviceId).collection("aggregates").doc(todayDateId);
      batchAggregates.set(aggRef, agg, { merge: true });
      aggregateWrites.push(deviceId);
    }

    console.log(`Preparing ${aggregateWrites.length} aggregate documents...`);
    await batchAggregates.commit();
    console.log(`Successfully wrote aggregates for ${aggregateWrites.length} devices`);

    // --- Step 3: Process Unrecovered Backups ---
    console.log(`\n PROCESSING UNRECOVERED BACKUPS`);
    const backupsSnapshot = await db.collection("backups").where("Recovered", "==", false).get();
    
    console.log(`Found ${backupsSnapshot.size} unrecovered backup documents`);

    const batchBackups = db.batch();
    const backupsByDeviceDate: Record<string, BackupAggregate> = {};
    let processedBackupCount = 0;

    backupsSnapshot.forEach(doc => {
      const data = doc.data();
      const deviceId = data.deviceId;
      const uploadedAt = data.uploadedAt.toDate ? data.uploadedAt.toDate() : new Date(data.uploadedAt);
      const backupDateId = getDateId(getManilaDate(uploadedAt));
      const key = `${deviceId}__${backupDateId}`;

      if (!backupsByDeviceDate[key]) {
        backupsByDeviceDate[key] = {
          coins_1: 0,
          coins_5: 0,
          coins_10: 0,
          coins_20: 0,
          total: 0,
          reasons: [],
          timestamp: admin.firestore.Timestamp.fromDate(uploadedAt)
        };
      }

      backupsByDeviceDate[key].coins_1 += data.coins_1 || 0;
      backupsByDeviceDate[key].coins_5 += data.coins_5 || 0;
      backupsByDeviceDate[key].coins_10 += data.coins_10 || 0;
      backupsByDeviceDate[key].coins_20 += data.coins_20 || 0;
      backupsByDeviceDate[key].total += data.total || 0;
      backupsByDeviceDate[key].reasons.push(data.reason || "");
      if (uploadedAt > backupsByDeviceDate[key].timestamp.toDate()) {
        backupsByDeviceDate[key].timestamp = admin.firestore.Timestamp.fromDate(uploadedAt);
      }

      // Mark original backup as recovered
      batchBackups.update(doc.ref, { Recovered: true });
      processedBackupCount++;
    });

    console.log(`Aggregated ${backupsSnapshot.size} backups into ${Object.keys(backupsByDeviceDate).length} device-date combinations`);

    // Write aggregated backups to Units backups subcollection
    console.log(`Writing aggregated backups...`);
    for (const key in backupsByDeviceDate) {
      const [deviceId, dateId] = key.split("__");
      const backupRef = db.collection("Units").doc(deviceId).collection("backups").doc(dateId);
      batchBackups.set(backupRef, backupsByDeviceDate[key], { merge: true });
      console.log(`   • Backup for ${deviceId} on ${dateId}: ₱${backupsByDeviceDate[key].total}`);
    }

    await batchBackups.commit();
    console.log(`Successfully processed ${processedBackupCount} backups`);

    // --- Final Summary ---
    console.log(`\n AGGREGATION PROCESS COMPLETED SUCCESSFULLY`);
    console.log(`Date: ${todayDateId}`);
    console.log(`Devices Aggregated: ${Object.keys(deviceAggregates).length}`);
    console.log(`Total Sales: ${salesSnapshot.size} transactions`);
    console.log(`Total Revenue: ₱${totalSalesAmount}`);
    console.log(`Backups Processed: ${backupsSnapshot.size}`);
    console.log(`Completed at: ${new Date().toISOString()}`);
    console.log(`=========================================`);

    return NextResponse.json({
      success: true,
      message: "Aggregates and backups processed successfully",
      summary: {
        date: todayDateId,
        devicesAggregated: Object.keys(deviceAggregates),
        salesProcessed: salesSnapshot.size,
        totalRevenue: totalSalesAmount,
        backupsProcessed: backupsSnapshot.size,
        deviceBreakdown: deviceAggregates
      }
    });

  } catch (err) {
    console.error(`AGGREGATION PROCESS FAILED:`);
    console.error(`Error: ${(err as Error).message}`);
    console.error(`Stack: ${(err as Error).stack}`);
    return NextResponse.json({ 
      success: false, 
      error: (err as Error).message 
    }, { status: 500 });
  }
}