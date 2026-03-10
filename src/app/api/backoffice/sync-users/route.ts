import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });
  }

  try {
    const auth = await getAdminAuth();
    const db = await getAdminDb();

    // 1. List all users from Firebase Auth
    const listUsersResult = await auth.listUsers();
    const authUsers = listUsersResult.users;

    const results = {
      total: authUsers.length,
      synced: 0,
      alreadyExists: 0,
      errors: 0,
      details: [] as string[],
    };

    const now = new Date().toISOString();

    // 2. Process each user
    for (const authUser of authUsers) {
      const userDocRef = db.collection("users").doc(authUser.uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        // Create the document if it doesn't exist
        try {
          // Attempt to parse names from displayName
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
            role: "user", // Default role
            address: { line1: "", district: "", province: "", zip: "" },
            createdAt: authUser.metadata.creationTime || now,
            updatedAt: now,
          });
          results.synced++;
          results.details.push(`Synced: ${authUser.email}`);
        } catch (err) {
          results.errors++;
          results.details.push(`Error syncing ${authUser.email}: ${err}`);
        }
      } else {
        results.alreadyExists++;
      }
    }

    return NextResponse.json({
      message: "Sync completed",
      results,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
