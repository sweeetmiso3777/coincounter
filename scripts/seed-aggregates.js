const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("./serviceAccountKey.json"); // Update path

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAggregateData(unitId, branchId, date) {
  const coins_1 = getRandomInt(50, 200);
  const coins_5 = getRandomInt(10, 50);
  const coins_10 = getRandomInt(5, 30);
  const coins_20 = getRandomInt(1, 15);
  
  const total = (coins_1 * 1) + (coins_5 * 5) + (coins_10 * 10) + (coins_20 * 20);
  const sales_count = getRandomInt(5, 25);

  // Create createdAt timestamp that's slightly after the data date
  // to simulate realistic aggregation timing
  const createdAt = new Date(date);
  createdAt.setHours(23, 59, 0, 0); // Set to end of day when aggregation would run

  return {
    coins_1,
    coins_5,
    coins_10,
    coins_20,
    total,
    sales_count,
    branchId,
    timestamp: admin.firestore.Timestamp.fromDate(date), // Date the data represents
    createdAt: admin.firestore.Timestamp.fromDate(createdAt), // When aggregate was created
    harvested: false
  };
}

async function seedAggregates() {
  try {
    console.log("🚀 Starting aggregates seeding...");

    // Get all units from Firestore
    const unitsSnapshot = await db.collection("Units").get();
    
    if (unitsSnapshot.empty) {
      console.log("❌ No units found in database");
      return;
    }

    console.log(`📦 Found ${unitsSnapshot.size} units`);

    const batch = db.batch();
    let batchCount = 0;
    let totalAggregates = 0;

    // Generate data for past 30 days
    for (let day = 0; day < 30; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(12, 0, 0, 0); // Set to noon for consistency

      const dateId = date.toISOString().split('T')[0];

      for (const unitDoc of unitsSnapshot.docs) {
        const unitData = unitDoc.data();
        const unitId = unitDoc.id;
        const branchId = unitData.branchId;

        if (!branchId) {
          console.log(`⚠️ Unit ${unitId} has no branchId, skipping`);
          continue;
        }

        const aggregateData = generateAggregateData(unitId, branchId, date);
        const aggRef = db.collection("Units").doc(unitId).collection("aggregates").doc(dateId);
        
        batch.set(aggRef, aggregateData);
        batchCount++;
        totalAggregates++;

        // Firestore batches have 500 operation limit
        if (batchCount >= 450) {
          console.log(`📤 Writing batch of ${batchCount} operations...`);
          await batch.commit();
          batchCount = 0;
        }
      }
    }

    // Commit any remaining operations
    if (batchCount > 0) {
      console.log(`📤 Writing final batch of ${batchCount} operations...`);
      await batch.commit();
    }

    console.log(`✅ Successfully seeded ${totalAggregates} aggregate documents across ${unitsSnapshot.size} units for the past 30 days`);
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    process.exit(0);
  }
}

// Run the seeder
seedAggregates();