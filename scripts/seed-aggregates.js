const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function randomTimeForDay(date) {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, 0, 0, 0
  );
  const endOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23, 59, 59, 999
  );

  const randomMillis =
    startOfDay.getTime() +
    Math.random() * (endOfDay.getTime() - startOfDay.getTime());

  return admin.firestore.Timestamp.fromDate(new Date(randomMillis));
}

async function seedSales() {
  const devices = ["C0C4597F", "D0C4597F"];

  for (const deviceId of devices) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset); // today, yesterday, etc.

      for (let i = 0; i < 25; i++) {
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
          timestamp: randomTimeForDay(date),
        };

        await db.collection("sales").add(saleData);
        console.log(`✅ Sale ${i + 1}/25 for ${deviceId} on ${date.toDateString()} created`);
      }
    }
  }

  console.log("🎉 Done seeding 25 sales/day for the past 7 days for 2 devices.");
}

seedSales().catch(console.error);
