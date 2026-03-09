# Bc-Green-Full

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/(user)/page.tsx`. The page auto-updates as you edit the file.

## Firebase setup

> หากต้องการรันแอปโดยไม่เชื่อมต่อ Firebase ให้เว้นค่าตัวแปรสภาพแวดล้อมไว้เปล่า (หรือไม่สร้างไฟล์ `.env.local`) ซึ่งจะทำให้
> `isFirebaseConfigured` เท่ากับ `false` และส่วนติดต่อผู้ใช้จะแสดงข้อความ
> "Firebase ยังไม่พร้อมใช้งาน" แทนการเรียกฐานข้อมูลจริง

## Firebase setup

1. Create a Firebase project and add a Web App.
2. Enable Authentication:
   - Email/Password (for real users)
   - Anonymous (used as a fallback for guest submissions)
3. Enable Cloud Firestore and Cloud Storage.
4. Add the Firebase config to `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
5. Deploy security rules:
   - `firebase deploy --only firestore:rules,storage`

### Collections (recommended schema)

- `repairs`
  - `trackingCode` (string)
  - `status` ("received" | "diagnosing" | "repairing" | "completed" | "rejected")
  - `createdBy` (uid string)
  - `createdAt` (ISO string)
  - `updatedAt` (ISO string)
  - `title`, `detail`, `category`, `preferredDate`, `vehicleModel`, `serialNumber`
  - `contactName`, `contactPhone`, `contactEmail`
  - `attachments` (array of { name, url, type })
  - `timeline` (array of { status, updatedAt, note? })

- `technicianNotices`
  - `type` ("new-repair" | "status-update")
  - `repairId`, `createdAt`, `seen`, `title`, `detail`

- `users`
  - `name`, `email`, `phone`, `address`
  - `role` ("user" | "technician")

- `supportFaqs`, `supportManuals`, `promotions`, `announcements`
  - store help center + marketing content (public read, staff write)

### Roles

For technician access, create or update `users/{uid}` with `role: "technician"`.
This can be done from the Firebase console (rules do not block admin console edits).

### Seed initial collections

Open `/backoffice` and click **Seed data** to create the base collections (support FAQs, manuals, promotions, announcements).
The seed writes a `system/bootstrap` doc so it only runs once.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to load Chakra Petch and Kanit.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
