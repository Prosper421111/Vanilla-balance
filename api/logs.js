import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = { /* SAME AS ABOVE */ };
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

export default async function handler(req, res) {
  try {
    const snap = await db.collection('submissions').orderBy('timestamp', 'desc').get();
    const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(logs);
  } catch (e) {
    res.status(500).json([]);
  }
}
