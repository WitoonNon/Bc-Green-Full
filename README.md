# BC Green Project (Full Version)

โปรเจกต์ระบบบริหารจัดการงานซ่อมและบริการ (Backoffice) พัฒนาด้วย Next.js และ Firebase

## 🚀 การเริ่มต้นใช้งาน (Getting Started)

1. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```

2. รันโหมด Development:
   ```bash
   npm run dev
   ```

3. เข้าใช้งาน:
   - หน้าผู้ใช้: [http://localhost:3000](http://localhost:3000)
   - หน้าหลังบ้าน (Backoffice): [http://localhost:3000/backoffice](http://localhost:3000/backoffice)

---

## ⚙️ การตั้งค่าระบบ (Configuration)

### 1. ไฟล์ `.env.local`
สร้างไฟล์ `.env.local` ที่ Root directory และใส่ค่าดังนี้:

```env
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

# Firebase Admin (Secret - สำหรับจัดการผู้ใช้และรูปภาพ)
FIREBASE_ADMIN_PROJECT_ID=xxx
FIREBASE_ADMIN_CLIENT_EMAIL=xxx
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Vercel Blob Storage (แนะนำสำหรับรูปภาพบน Cloud)
BLOB_READ_WRITE_TOKEN=xxx
```

### 2. การตั้งค่า Firebase Admin
ไปที่ **Firebase Console** -> **Project Settings** -> **Service Accounts**
- กดปุ่ม **Generate new private key** เพื่อดาวน์โหลดไฟล์ JSON
- นำค่าจากไฟล์ JSON มาใส่ใน `FIREBASE_ADMIN_...` ใน `.env.local`

---

## 💾 ระบบจัดการไฟล์ (File Upload)

ระบบรองรับการอัปโหลดไฟล์ 3 ระดับ (อัตโนมัติ):
1. **Vercel Blob (แนะนำ):** หากใส่ `BLOB_READ_WRITE_TOKEN` ระบบจะอัปโหลดขึ้น Vercel ทันที
   - ⚠️ **สำคัญ:** ต้องตั้งค่า Blob ใน Vercel Dashboard ให้เป็น **Public** เท่านั้น
2. **Firebase Storage (สำรอง):** หากไม่มี Vercel Token ระบบจะส่งไปที่ Firebase Storage แทน
   - ⚠️ **สำคัญ:** ต้องกด **Get Started** ในเมนู Storage ของ Firebase Console ก่อน
3. **Local Storage (ฟรี):** หากไม่ได้ตั้งค่า Cloud ทั้งคู่ ระบบจะเก็บไฟล์ไว้ในโฟลเดอร์ `public/uploads` ในเครื่องแทน

---

## 👥 การจัดการผู้ใช้งาน (User Management)

หากคุณมีผู้ใช้ในระบบ **Firebase Authentication** อยู่แล้ว แต่รายชื่อไม่ขึ้นในหน้าเว็บ ให้ใช้สคริปต์ Sync ข้อมูล:

```bash
node scripts/sync-users.mjs
```
สคริปต์นี้จะอ่านรายชื่อจาก Auth และสร้างข้อมูลพื้นฐานใน Firestore (คอลเลกชัน `users`) ให้โดยอัตโนมัติ

---

## 🛠️ โครงสร้างข้อมูล (Firestore Collections)

- `users`: ข้อมูลโปรไฟล์ผู้ใช้ (Role: `user`, `technician`, `admin`)
- `repairs`: รายการแจ้งซ่อมและประวัติการซ่อม
- `promotions`: รายการโปรโมชันและสิทธิพิเศษ
- `announcements`: ประกาศประชาสัมพันธ์
- `supportFaqs` / `supportManuals`: ข้อมูลศูนย์ช่วยเหลือ

---

## 🌐 การ Deploy บน Vercel

1. เชื่อมต่อ GitHub Repository กับ Vercel
2. เพิ่ม **Environment Variables** ทั้งหมดจากไฟล์ `.env.local`
3. ไปที่เมนู **Storage** ใน Vercel Dashboard -> สร้าง **Blob**
4. **แก้ไขสิทธิ์ (Settings):** เปลี่ยนจาก **Private** เป็น **Public** เพื่อให้แสดงผลรูปภาพได้ถูกต้อง

