const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("./serviceAccountKey.json"); // Update path if needed

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// DATA MAPPING: 
// ESP1 = PC 1
// ESP2 = PC 2
// ESP3 = PC 3
// ESP4 = PC 4

const exactData = {
  "ESP1": [
    { date: "2025-11-09", c1: 10, c5: 12, c10: 2, c20: 0 },
    { date: "2025-11-10", c1: 6, c5: 5, c10: 0, c20: 0 },
    { date: "2025-11-11", c1: 3, c5: 2, c10: 0, c20: 0 },
    { date: "2025-11-12", c1: 3, c5: 2, c10: 0, c20: 0 },
    { date: "2025-11-13", c1: 5, c5: 1, c10: 0, c20: 0 },
    { date: "2025-11-14", c1: 8, c5: 5, c10: 0, c20: 0 },
    { date: "2025-11-15", c1: 8, c5: 10, c10: 0, c20: 0 },
    { date: "2025-11-16", c1: 11, c5: 5, c10: 1, c20: 0 },
    { date: "2025-11-17", c1: 8, c5: 0, c10: 1, c20: 0 },
    { date: "2025-11-18", c1: 2, c5: 3, c10: 1, c20: 0 },
  ],
  "ESP2": [
    { date: "2025-11-09", c1: 31, c5: 21, c10: 2, c20: 0 },
    { date: "2025-11-10", c1: 15, c5: 5, c10: 1, c20: 0 },
    { date: "2025-11-11", c1: 10, c5: 9, c10: 0, c20: 0 },
    { date: "2025-11-12", c1: 14, c5: 6, c10: 0, c20: 0 },
    { date: "2025-11-13", c1: 13, c5: 5, c10: 0, c20: 0 },
    { date: "2025-11-14", c1: 33, c5: 25, c10: 1, c20: 0 },
    { date: "2025-11-15", c1: 26, c5: 17, c10: 1, c20: 0 },
    { date: "2025-11-16", c1: 36, c5: 13, c10: 0, c20: 0 },
    { date: "2025-11-17", c1: 15, c5: 7, c10: 0, c20: 0 },
    { date: "2025-11-18", c1: 10, c5: 7, c10: 1, c20: 0 },
  ],
  "ESP3": [
    { date: "2025-11-09", c1: 12, c5: 13, c10: 1, c20: 0 },
    { date: "2025-11-10", c1: 1, c5: 5, c10: 0, c20: 0 },
    { date: "2025-11-11", c1: 5, c5: 4, c10: 0, c20: 0 },
    { date: "2025-11-12", c1: 5, c5: 6, c10: 0, c20: 0 },
    { date: "2025-11-13", c1: 3, c5: 2, c10: 0, c20: 0 },
    { date: "2025-11-14", c1: 7, c5: 17, c10: 2, c20: 0 },
    { date: "2025-11-15", c1: 12, c5: 14, c10: 1, c20: 0 },
    { date: "2025-11-16", c1: 15, c5: 11, c10: 1, c20: 0 },
    { date: "2025-11-17", c1: 4, c5: 2, c10: 0, c20: 0 },
    { date: "2025-11-18", c1: 5, c5: 2, c10: 0, c20: 0 },
  ],
  "ESP4": [
    { date: "2025-11-09", c1: 53, c5: 30, c10: 0, c20: 0 },
    { date: "2025-11-10", c1: 21, c5: 15, c10: 0, c20: 0 },
    { date: "2025-11-11", c1: 21, c5: 7, c10: 0, c20: 0 },
    { date: "2025-11-12", c1: 4, c5: 13, c10: 1, c20: 0 },
    { date: "2025-11-13", c1: 16, c5: 10, c10: 0, c20: 0 },
    { date: "2025-11-14", c1: 38, c5: 22, c10: 2, c20: 0 },
    { date: "2025-11-15", c1: 47, c5: 36, c10: 0, c20: 0 },
    { date: "2025-11-16", c1: 45, c5: 38, c10: 1, c20: 0 },
    { date: "2025-11-17", c1: 17, c5: 9, c10: 0, c20: 0 },
    { date: "2025-11-18", c1: 27, c5: 6, c10: 1, c20: 0 },
  ]
};

async function seedExactAggregates() {
  try {
    console.log("🚀 Starting EXACT value seeding for testing period...");

    let batch = db.batch();
    let batchCount = 0;
    let totalOperations = 0;

    // Loop through each Unit ID defined in our data
    for (const [unitId, dailyRecords] of Object.entries(exactData)) {

      // 1. Get the Unit Document to retrieve the correct branchId
      const unitDocRef = db.collection("Units").doc(unitId);
      const unitSnapshot = await unitDocRef.get();

      if (!unitSnapshot.exists) {
        console.log(`⚠️ Unit ${unitId} does not exist in Firestore! Skipping data for this unit.`);
        continue;
      }

      const unitData = unitSnapshot.data();
      const branchId = unitData.branchId;

      if (!branchId) {
        console.log(`⚠️ Unit ${unitId} has no branchId set. Skipping.`);
        continue;
      }

      console.log(`🔹 Processing ${unitId} (PC ${unitId.replace('ESP', '')}) - Branch: ${branchId}`);

      // 2. Loop through the days for this unit
      for (const record of dailyRecords) {
        const dateId = record.date;

        // Create Date objects
        const dateObj = new Date(dateId);
        // Set timestamp to noon just to be safe for display
        dateObj.setHours(12, 0, 0, 0);

        // Create createdAt timestamp (end of day)
        const createdAtObj = new Date(dateId);
        createdAtObj.setHours(23, 59, 59, 999);

        // Calculate Total Amount
        const totalAmount = (record.c1 * 1) + (record.c5 * 5) + (record.c10 * 10) + (record.c20 * 20);

        // Calculate Sales Count (Total Coin Insertions)
        const totalSalesCount = record.c1 + record.c5 + record.c10 + record.c20;

        const aggregateData = {
          coins_1: record.c1,
          coins_5: record.c5,
          coins_10: record.c10,
          coins_20: record.c20,
          total: totalAmount,
          sales_count: totalSalesCount,
          branchId: branchId,
          timestamp: admin.firestore.Timestamp.fromDate(dateObj),
          createdAt: admin.firestore.Timestamp.fromDate(createdAtObj),
          harvested: false,
        };

        const aggRef = db
          .collection("Units")
          .doc(unitId)
          .collection("aggregates")
          .doc(dateId); // Doc ID will be "2025-11-09", etc.

        batch.set(aggRef, aggregateData);
        batchCount++;
        totalOperations++;
      }
    }

    // Commit the batch
    if (batchCount > 0) {
      console.log(`📤 Committing ${batchCount} records to Firestore...`);
      await batch.commit();
    }

    console.log(`✅ Successfully seeded ${totalOperations} aggregate records for Nov 9 - Nov 18.`);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    process.exit(0);
  }
}

seedExactAggregates();