import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach(line => {
    line = line.trim();
    if (!line || line.startsWith("#")) return;
    const eqIdx = line.indexOf("=");
    if (eqIdx !== -1) {
        const key = line.substring(0, eqIdx).trim();
        let val = line.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
        }
        if (key === "FIREBASE_ADMIN_PRIVATE_KEY") val = val.replace(/\\n/g, "\n");
        env[key] = val;
    }
});

if (!env.FIREBASE_ADMIN_PROJECT_ID) {
    console.error("Missing FIREBASE_ADMIN_PROJECT_ID");
    process.exit(1);
}

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY,
        }),
    });
}

const db = getFirestore();

async function check() {
    const snapshot = await db.collection("users").get();
    console.log(`Firestore 'users' collection has ${snapshot.size} documents.`);
    snapshot.forEach(doc => {
        console.log(`- ID: ${doc.id}, Data:`, JSON.stringify(doc.data()));
    });
}

check();
