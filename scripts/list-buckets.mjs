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

async function list() {
    try {
        console.log("Listing all available buckets for project:", env.FIREBASE_ADMIN_PROJECT_ID);
        // storage.bucket().storage is the underlying @google-cloud/storage Storage instance
        const [buckets] = await storage.bucket("dummy").storage.getBuckets();
        if (buckets.length === 0) {
            console.log("No buckets found. Storage service might not be enabled.");
        } else {
            console.log("Found buckets:");
            buckets.forEach(b => console.log("- ", b.name));
        }
    } catch (err) {
        console.error("Error listing buckets:", err.message);
    }
}

list();
