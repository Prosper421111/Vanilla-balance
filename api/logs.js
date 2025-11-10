import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://vanilla-3be8f.firebaseio.com"
  });
}

const db = admin.database();

export default async function handler(req, res) {
  try {
    const snapshot = await db.ref("submissions").once("value");
    const data = snapshot.val() || {};
    const logs = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
    res.status(200).json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ error: err.message });
  }
}
