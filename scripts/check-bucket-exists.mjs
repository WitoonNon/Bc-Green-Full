import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
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

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY,
        })
    });
}

const storage = getStorage();

async function check() {
    const project = env.FIREBASE_ADMIN_PROJECT_ID;
    const buckets = [
        `${project}.firebasestorage.app`,
        `${project}.appspot.com`,
        project
    ];

    console.log("Checking possible bucket names for project:", project);
    for (const b of buckets) {
        try {
            console.log(`Checking bucket: ${b}...`);
            const bucket = storage.bucket(b);
            const [exists] = await bucket.exists();
            if (exists) {
                console.log(`[FOUND] Bucket exists: ${b}`);
            } else {
                console.log(`[NOT FOUND] Bucket does not exist: ${b}`);
            }
        } catch (err) {
            console.log(`[ERROR] Bucket ${b}:`, err.message);
        }
    }
}

check();
