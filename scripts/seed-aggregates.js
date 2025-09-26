const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function randomTimeToday() {
  const now = new Date();
  const manilaNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

  const startOfDay = new Date(
    manilaNow.getFullYear(),
    manilaNow.getMonth(),
    manilaNow.getDate(),
    0, 0, 0, 0
  );
  const endOfDay = new Date(
    manilaNow.getFullYear(),
    manilaNow.getMonth(),
    manilaNow.getDate(),
    23, 59, 59, 999
  );

  const randomMillis =
    startOfDay.getTime() +
    Math.random() * (endOfDay.getTime() - startOfDay.getTime());

  return admin.firestore.Timestamp.fromDate(new Date(randomMillis));
}

async function seedSales() {
  const deviceId = "C0C4597F";

  // Try to fetch branchId from Units/{deviceId}
  const unitRef = db.collection("Units").doc(deviceId);
  const unitDoc = await unitRef.get();
  let branchId = "UNASSIGNED";
  if (unitDoc.exists && unitDoc.get("branchId")) {
    branchId = unitDoc.get("branchId");
  }

  for (let i = 0; i < 177; i++) {
    const coins_1 = Math.floor(Math.random() * 6);
    const coins_5 = Math.floor(Math.random() * 6);
    const coins_10 = Math.floor(Math.random() * 6);
    const coins_20 = Math.floor(Math.random() * 6);

    const total = coins_1 * 1 + coins_5 * 5 + coins_10 * 10 + coins_20 * 20;

    const saleData = {
      deviceId,
      branchId,
      coins_1,
      coins_5,
      coins_10,
      coins_20,
      total,
      timestamp: randomTimeToday(), // ✅ random time today, Manila timezone
    };

    await db.collection("sales").add(saleData);
    console.log(`✅ Sale ${i + 1}/177 created`);
  }

  console.log("🎉 Done seeding 177 random sales for today.");
}

seedSales().catch(console.error);
