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

  // Start from current PH time
  let lastTimestamp = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );

  let saleCount = 1;

  while (true) {
    // Increment timestamp by random 1–7 seconds
    const offset = randomOffsetSeconds();
    lastTimestamp.setSeconds(lastTimestamp.getSeconds() + offset);

    // Wait for the same random interval to simulate real-time
    await wait(offset * 1000);

    const coins_1 = Math.floor(Math.random() * 20) + 1;   // 1–20
    const coins_5 = Math.floor(Math.random() * 3) + 1;    // 1–3
    const coins_10 = Math.floor(Math.random() * 2) + 1;   // 1–2
    const coins_20 = 1;                                   // always 1

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
      `✅ Sale ${saleCount} for ${deviceId} inserted at ${lastTimestamp.toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila",
      })} (₱${total})`
    );

    saleCount++;
  }
}

seedRandomSales().catch(console.error);
