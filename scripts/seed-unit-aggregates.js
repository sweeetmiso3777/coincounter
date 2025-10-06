const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDateId(date) {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

async function seedUnitAggregates() {
  try {
    // Get all devices from Units collection
    const unitsSnapshot = await db.collection("Units").get();
    
    if (unitsSnapshot.empty) {
      console.log("No devices found in Units collection");
      return;
    }

    console.log(`Found ${unitsSnapshot.size} devices to seed aggregates for`);

    const batch = db.batch();
    let totalAggregatesCreated = 0;

    // Fixed date: 2025-09-29
    const fixedDate = new Date('2025-09-29T00:00:00+08:00'); // Manila time
    const dateId = getDateId(fixedDate);

    // For each device, create ONE aggregate for 2025-09-29
    for (const unitDoc of unitsSnapshot.docs) {
      const deviceId = unitDoc.id;
      
      // Generate realistic coin data based on typical sales
      const coins_1 = getRandomInt(50, 200);
      const coins_5 = getRandomInt(30, 100);
      const coins_10 = getRandomInt(20, 80);
      const coins_20 = getRandomInt(10, 50);
      const total = coins_1 * 1 + coins_5 * 5 + coins_10 * 10 + coins_20 * 20;
      const sales_count = getRandomInt(5, 15);

      const aggregate = {
        coins_1,
        coins_5,
        coins_10,
        coins_20,
        total,
        sales_count,
        timestamp: admin.firestore.Timestamp.fromDate(fixedDate)
      };

      const aggRef = db.collection("Units").doc(deviceId).collection("aggregates").doc(dateId);
      batch.set(aggRef, aggregate);
      totalAggregatesCreated++;

      console.log(`Prepared aggregate for ${deviceId} on ${dateId}: ${sales_count} sales, ₱${total}`);
    }

    // Commit all aggregates
    console.log(`Committing ${totalAggregatesCreated} aggregates...`);
    await batch.commit();
    console.log("✅ All aggregates committed successfully");

  } catch (err) {
    console.error("Seeder error:", err);
  }
}

seedUnitAggregates().catch(console.error);