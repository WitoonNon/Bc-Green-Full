import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// 1. Manually load .env.local
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
        if (key === "FIREBASE_ADMIN_PRIVATE_KEY") {
            val = val.replace(/\\n/g, "\n");
        }
        env[key] = val;
    }
});
console.log("Loaded keys:", Object.keys(env).filter(k => k.startsWith("FIREBASE_ADMIN")));


const projectId = env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase Admin environment variables in .env.local");
    process.exit(1);
}

// 2. Initialize Firebase Admin
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
}

const auth = getAuth();
const db = getFirestore();

async function sync() {
    console.log("Starting sync...");
    try {
        const listUsersResult = await auth.listUsers();
        const authUsers = listUsersResult.users;
        console.log(`Found ${authUsers.length} users in Firebase Authentication.`);

        let synced = 0;
        let exists = 0;
        const now = new Date().toISOString();

        for (const authUser of authUsers) {
            const userDocRef = db.collection("users").doc(authUser.uid);
            const userDoc = await userDocRef.get();

            if (!userDoc.exists) {
                let firstName = "";
                let lastName = "";
                if (authUser.displayName) {
                    const parts = authUser.displayName.trim().split(/\s+/);
                    firstName = parts[0] || "";
                    lastName = parts.slice(1).join(" ") || "";
                }

                await userDocRef.set({
                    id: authUser.uid,
                    email: authUser.email || "",
                    displayName: authUser.displayName || "",
                    firstName: firstName,
                    lastName: lastName,
                    phone: authUser.phoneNumber || "",
                    role: "user",
                    address: { line1: "", district: "", province: "", zip: "" },
                    createdAt: authUser.metadata.creationTime || now,
                    updatedAt: now,
                });
                console.log(`[SYNCED] ${authUser.email} (${authUser.uid})`);
                synced++;
            } else {
                console.log(`[EXISTS] ${authUser.email} (${authUser.uid})`);
                exists++;
            }
        }

        console.log("\nSync Summary:");
        console.log(`- Total Auth Users: ${authUsers.length}`);
        console.log(`- New Users Synced: ${synced}`);
        console.log(`- Users Already in Firestore: ${exists}`);
        console.log("Done!");
    } catch (error) {
        console.error("Sync failed:", error);
    }
}

sync();
