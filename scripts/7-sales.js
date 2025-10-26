const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function getDeviceIds() {
  const unitsSnapshot = await db.collection('Units').get();
  const deviceIds = [];
  unitsSnapshot.forEach(doc => {
    deviceIds.push(doc.id);
  });
  return deviceIds;
}

function randomInterval(min = 100, max = 1000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCoinData() {
  const coins_1 = Math.floor(Math.random() * 15) + 1;
  const coins_5 = Math.floor(Math.random() * 3) + 1;
  const coins_10 = Math.floor(Math.random() * 2) + 1;
  const coins_20 = Math.random() > 0.7 ? 1 : 0;
  const total = coins_1 * 1 + coins_5 * 5 + coins_10 * 10 + coins_20 * 20;
  return { coins_1, coins_5, coins_10, coins_20, total };
}

async function seedSales() {
  const DEVICE_IDS = await getDeviceIds();
  console.log(`Found ${DEVICE_IDS.length} devices: ${DEVICE_IDS.join(', ')}`);
  
  let totalSaleCount = 1;

  while (true) {
    const randomDevice = DEVICE_IDS[Math.floor(Math.random() * DEVICE_IDS.length)];
    const timestamp = new Date();
    
    const { coins_1, coins_5, coins_10, coins_20, total } = generateCoinData();

    const saleData = {
      deviceId: randomDevice,
      coins_1,
      coins_5,
      coins_10,
      coins_20,
      total,
      timestamp: admin.firestore.Timestamp.fromDate(timestamp),
    };

    try {
      await db.collection("sales").add(saleData);
      console.log(
        `✅ Sale ${totalSaleCount} | Device: ${randomDevice} | Amount: ₱${total}`
      );
      totalSaleCount++;
    } catch (error) {
      console.error(`Error inserting sale for ${randomDevice}:`, error);
    }

    await new Promise(resolve => setTimeout(resolve, randomInterval()));
  }
}

seedSales().catch(console.error);