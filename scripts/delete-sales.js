const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function clearSalesCollection() {
  const salesRef = db.collection("sales");
  const snapshot = await salesRef.get();

  if (snapshot.empty) {
    console.log("No documents to delete in the sales collection.");
    return;
  }

  for (const doc of snapshot.docs) {
    await doc.ref.delete();
    console.log(`🗑️ Deleted document: ${doc.id}`);
  }

  console.log("✅ All documents in the sales collection have been deleted.");
}

clearSalesCollection().catch(console.error);
