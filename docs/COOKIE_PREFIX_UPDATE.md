# 🍪 Cookie Prefix Update - Summary

อัปเดทระบบ Cookie เพื่อรองรับการรันหลาย Environment พร้อมกัน

---

## ✨ การเปลี่ยนแปลง

### 1. NextAuth Cookie Configuration
เพิ่ม custom cookie names ด้วย prefix ใน `src/app/api/auth/[...nextauth]/route.ts`

**ก่อน:**
```typescript
// ใช้ default cookie names
// next-auth.session-token
// next-auth.callback-url
// next-auth.csrf-token
```

**หลัง:**
```typescript
cookies: {
  sessionToken: {
    name: `${process.env.NEXTAUTH_COOKIE_PREFIX || "safem0de-gpt"}.session-token`,
    // ...
  },
  callbackUrl: {
    name: `${process.env.NEXTAUTH_COOKIE_PREFIX || "safem0de-gpt"}.callback-url`,
    // ...
  },
  csrfToken: {
    name: `${process.env.NEXTAUTH_COOKIE_PREFIX || "safem0de-gpt"}.csrf-token`,
    // ...
  },
}
```

### 2. Environment Variable
เพิ่ม `NEXTAUTH_COOKIE_PREFIX` ใน `.env.local`

```env
# Cookie Prefix (ป้องกัน session ชนกันเมื่อรันหลายระบบบน localhost)
NEXTAUTH_COOKIE_PREFIX=safem0de-gpt-dev
```

### 3. Environment Templates
สร้างไฟล์ template สำหรับแต่ละ environment:
- `.env.development.example` → สำหรับ dev
- `.env.staging.example` → สำหรับ staging
- `.env.production.example` → สำหรับ production

### 4. Package Scripts
เพิ่ม npm scripts สำหรับรันแต่ละ environment:

```json
{
  "scripts": {
    "dev": "next dev",              // port 3000 (dev)
    "dev:staging": "next dev -p 3001",
    "dev:prod": "next dev -p 3002"
  }
}
```

---

## 🎯 ผลลัพธ์

### Cookie Names แต่ละ Environment

| Environment | Cookie Name | Port |
|------------|-------------|------|
| Development | `safem0de-gpt-dev.session-token` | 3000 |
| Staging | `safem0de-gpt-staging.session-token` | 3001 |
| Production | `safem0de-gpt.session-token` | 3002 |

### ประโยชน์
- ✅ รันหลาย environment บน localhost พร้อมกัน
- ✅ Session แยกกันชัดเจน
- ✅ Login/Logout ไม่กระทบกัน
- ✅ ทดสอบได้หลาย environment พร้อมกัน

---

## 📝 วิธีใช้งาน

### รัน Development (ปกติ)
```bash
npm run dev
# http://localhost:3000
# Cookie: safem0de-gpt-dev.session-token
```

### รัน Staging (พร้อมกับ Dev)
```bash
# Terminal ใหม่
npm run dev:staging
# http://localhost:3001
# Cookie: safem0de-gpt-staging.session-token
```

### รัน Production (สำหรับทดสอบ)
```bash
# Terminal ใหม่
npm run dev:prod
# http://localhost:3002
# Cookie: safem0de-gpt.session-token
```

---

## ⚠️ Breaking Changes

### สำหรับ Users ที่มี Session อยู่แล้ว

เนื่องจาก cookie name เปลี่ยน คุณจะต้อง:

1. **Logout จาก app เก่า** (ถ้ายัง login อยู่)
2. **Clear cookies** (Ctrl+Shift+Delete)
3. **Login ใหม่**

### Cookie Name เปลี่ยนจาก:
```
next-auth.session-token
    ↓
safem0de-gpt-dev.session-token
```

---

## 🔧 Migration Steps

### สำหรับ Development

1. **อัปเดท `.env.local`:**
   ```env
   NEXTAUTH_COOKIE_PREFIX=safem0de-gpt-dev
   ```

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

3. **Clear cookies และ Login ใหม่**

### สำหรับ Staging

1. **สร้าง `.env.staging.local`:**
   ```bash
   cp .env.staging.example .env.staging.local
   ```

2. **แก้ไขค่าในไฟล์:**
   ```env
   NEXTAUTH_COOKIE_PREFIX=safem0de-gpt-staging
   NEXTAUTH_URL=http://localhost:3001
   # ... (ค่าอื่นๆ)
   ```

3. **รัน staging:**
   ```bash
   npm run dev:staging
   ```

### สำหรับ Production

1. **สร้าง `.env.production.local`:**
   ```bash
   cp .env.production.example .env.production.local
   ```

2. **แก้ไขค่าในไฟล์:**
   ```env
   NEXTAUTH_COOKIE_PREFIX=safem0de-gpt
   NEXTAUTH_URL=https://yourdomain.com
   # ... (ค่าอื่นๆ)
   ```

3. **Build และ Start:**
   ```bash
   npm run build:prod
   npm run start:prod
   ```

---

## 🧪 ทดสอบ

### 1. ตรวจสอบ Cookie Names

**Chrome DevTools:**
1. F12 → Application → Cookies
2. เลือก `http://localhost:3000`
3. ตรวจสอบชื่อ cookies:
   - ✅ `safem0de-gpt-dev.session-token`
   - ✅ `safem0de-gpt-dev.callback-url`
   - ✅ `safem0de-gpt-dev.csrf-token`

### 2. ทดสอบ Multi-Environment

```bash
# Terminal 1
npm run dev
# Login ที่ http://localhost:3000

# Terminal 2
npm run dev:staging
# เปิด http://localhost:3001 → ยังไม่ได้ login (ถูกต้อง!)
```

### 3. ทดสอบ Session Isolation

1. Login ใน Dev (3000)
2. Login ใน Staging (3001)
3. Logout จาก Dev → Staging ยัง login อยู่ (ถูกต้อง!)

---

## 📚 เอกสารเพิ่มเติม

- [MULTI_ENV_SETUP.md](./MULTI_ENV_SETUP.md) - คู่มือครบถ้วน
- [KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md) - Keycloak configuration
- [LOGOUT_FIX.md](./LOGOUT_FIX.md) - Logout troubleshooting

---

## 📊 Checklist

การอัปเดทเสร็จสมบูรณ์เมื่อ:

- [ ] มี `NEXTAUTH_COOKIE_PREFIX` ใน `.env.local`
- [ ] Cookie names เปลี่ยนแล้ว (ดูใน DevTools)
- [ ] Login ใหม่หลังจาก update สำเร็จ
- [ ] สามารถรันหลาย environment พร้อมกันได้
- [ ] Session แต่ละ environment แยกกัน

---

สร้างโดย Claude Code 🤖

วันที่อัปเดท: 2025-11-30
