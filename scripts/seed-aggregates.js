const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function getManilaDate(daysAgo = 0) {
  const today = new Date();
  const manilaDate = new Date(
    today.toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  manilaDate.setDate(manilaDate.getDate() - daysAgo);
  return manilaDate;
}

function getAggregateId(date) {
  return date
    .toLocaleDateString("en-US", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    .toLowerCase();
}

async function seedAggregates() {
  const branchesSnap = await db.collection("Branches").get();

  for (const branch of branchesSnap.docs) {
    const branchId = branch.id;

    // Generate aggregates for last 7 days
    for (let i = 0; i < 7; i++) {
      const date = getManilaDate(i);
      const aggregateId = getAggregateId(date);

      const aggregateData = {
        totalRevenue: Math.floor(Math.random() * 10000),
        totalTransactions: Math.floor(Math.random() * 100),
        coinBreakdown: {
          coins_1: Math.floor(Math.random() * 50),
          coins_5: Math.floor(Math.random() * 50),
          coins_10: Math.floor(Math.random() * 50),
          coins_20: Math.floor(Math.random() * 50),
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(), // ✅ NEW
      };

      await db
        .collection("Branches")
        .doc(branchId)
        .collection("Aggregates")
        .doc(aggregateId)
        .set(aggregateData);

      console.log(`✅ Seeded aggregate for branch ${branchId} on ${aggregateId}`);
    }
  }

  console.log("Done seeding aggregates for last 7 days.");
}

seedAggregates().catch(console.error);
