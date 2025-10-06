const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function randomTimeForToday() {
  const today = new Date();
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

  const randomMillis =
    startOfDay.getTime() +
    Math.random() * (endOfDay.getTime() - startOfDay.getTime());

  return admin.firestore.Timestamp.fromDate(new Date(randomMillis));
}

async function seedSalesToday() {
  const devices = ["C0C4597F", "D0C4597F"];

  for (const deviceId of devices) {
    for (let i = 0; i < 50; i++) {
      const coins_1 = Math.floor(Math.random() * 6);
      const coins_5 = Math.floor(Math.random() * 6);
      const coins_10 = Math.floor(Math.random() * 6);
      const coins_20 = Math.floor(Math.random() * 6);

      const total = coins_1 * 1 + coins_5 * 5 + coins_10 * 10 + coins_20 * 20;

      const saleData = {
        deviceId,
        coins_1,
        coins_5,
        coins_10,
        coins_20,
        total,
        timestamp: randomTimeForToday(),
      };

      await db.collection("sales").add(saleData);
      console.log(`✅ Sale ${i + 1}/50 for ${deviceId} today created`);
    }
  }

  console.log("Done seeding 50 sales per device for today.");
}

seedSalesToday().catch(console.error);
