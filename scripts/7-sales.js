const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Helper: random offset in seconds
function randomOffsetSeconds(min = 1, max = 7) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: random delay (ms)
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedRandomSales() {
  const deviceId = "C0C4597F";

  // Get "today" start of day in Asia/Manila timezone
  const now = new Date();
  const philippineTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  philippineTime.setHours(0, 0, 0, 0); // midnight PH time

  let lastTimestamp = philippineTime;

  for (let i = 0; i < 20; i++) {
    // Increment timestamp by random 1–7 seconds
    lastTimestamp.setSeconds(lastTimestamp.getSeconds() + randomOffsetSeconds());

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
      timestamp: admin.firestore.Timestamp.fromDate(new Date(lastTimestamp)),
    };

    await db.collection("sales").add(saleData);
    console.log(
      `✅ Sale ${i + 1}/20 for ${deviceId} inserted at ${lastTimestamp.toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila",
      })}`
    );

    // Random wait between sales (simulate real intervals)
    if (i < 19) {
      const delay = randomOffsetSeconds() * 1000;
      console.log(`⏳ Waiting ${delay / 1000}s before next sale...`);
      await wait(delay);
    }
  }

  console.log("🎉 Done seeding 20 randomized sales for 1 device (PH Time).");
}

seedRandomSales().catch(console.error);
