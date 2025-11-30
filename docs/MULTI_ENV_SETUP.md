# 🔀 Multi-Environment Setup Guide

คู่มือการตั้งค่าระบบหลาย environment (dev, staging, production) บน localhost พร้อมกัน

---

## 🎯 ปัญหาที่แก้

### ปัญหา: Session Cookie Conflicts
เมื่อรันหลาย Next.js app บน localhost พร้อมกัน (เช่น port 3000, 3001, 3002):
- ❌ Cookie ชื่อเดียวกัน (`next-auth.session-token`)
- ❌ Session ซ้อนทับกัน
- ❌ Login ใน app หนึ่ง แล้ว app อื่นก็ login ตาม
- ❌ Logout ใน app หนึ่ง แล้ว app อื่นก็ logout ตาม

### แก้ไข: Custom Cookie Prefix
แต่ละ environment มี cookie prefix ต่างกัน:
- ✅ Development: `safem0de-gpt-dev.session-token`
- ✅ Staging: `safem0de-gpt-staging.session-token`
- ✅ Production: `safem0de-gpt.session-token`

---

## 📁 โครงสร้างไฟล์

```
├── .env.local                    # ปัจจุบัน (development)
├── .env.development.example      # Template สำหรับ dev
├── .env.staging.example          # Template สำหรับ staging
├── .env.production.example       # Template สำหรับ production
└── src/
    └── app/
        └── api/
            └── auth/
                └── [...nextauth]/
                    └── route.ts  # ตั้งค่า custom cookies
```

---

## 🚀 Setup แต่ละ Environment

### 1. Development Environment

**Port:** 3000
**Database:** `Safem0de-gpt-dev`
**Cookie Prefix:** `safem0de-gpt-dev`

```bash
# คัดลอก template
cp .env.development.example .env.development.local

# แก้ไขค่าในไฟล์
# NEXTAUTH_COOKIE_PREFIX=safem0de-gpt-dev

# รัน
npm run dev
```

---

### 2. Staging Environment

**Port:** 3001
**Database:** `Safem0de-gpt-staging`
**Cookie Prefix:** `safem0de-gpt-staging`

```bash
# คัดลอก template
cp .env.staging.example .env.staging.local

# แก้ไขค่าในไฟล์
# NEXTAUTH_COOKIE_PREFIX=safem0de-gpt-staging

# รัน (port 3001)
PORT=3001 npm run dev
```

**หรือแก้ `package.json`:**
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:staging": "next dev -p 3001",
    "dev:prod": "next dev -p 3002"
  }
}
```

---

### 3. Production Environment (Local Testing)

**Port:** 3002
**Database:** `Safem0de-gpt`
**Cookie Prefix:** `safem0de-gpt`

```bash
# คัดลอก template
cp .env.production.example .env.production.local

# แก้ไขค่าในไฟล์
# NEXTAUTH_COOKIE_PREFIX=safem0de-gpt

# รัน (port 3002)
PORT=3002 npm run dev
```

---

## 🔧 Configuration Details

### NextAuth Cookie Configuration

**File:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
export const authOptions: NextAuthOptions = {
  // ...
  cookies: {
    sessionToken: {
      name: `${process.env.NEXTAUTH_COOKIE_PREFIX || "safem0de-gpt"}.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `${process.env.NEXTAUTH_COOKIE_PREFIX || "safem0de-gpt"}.callback-url`,
      // ...
    },
    csrfToken: {
      name: `${process.env.NEXTAUTH_COOKIE_PREFIX || "safem0de-gpt"}.csrf-token`,
      // ...
    },
  },
};
```

### Cookie Names by Environment

| Environment | Session Cookie Name |
|------------|---------------------|
| Development | `safem0de-gpt-dev.session-token` |
| Staging | `safem0de-gpt-staging.session-token` |
| Production | `safem0de-gpt.session-token` |

---

## 🎨 ตัวอย่าง: รัน 3 Environments พร้อมกัน

### Terminal 1: Development
```bash
npm run dev
# Running on http://localhost:3000
# Cookie: safem0de-gpt-dev.session-token
```

### Terminal 2: Staging
```bash
npm run dev:staging
# Running on http://localhost:3001
# Cookie: safem0de-gpt-staging.session-token
```

### Terminal 3: Production
```bash
npm run dev:prod
# Running on http://localhost:3002
# Cookie: safem0de-gpt.session-token
```

**ผลลัพธ์:**
- ✅ แต่ละ app มี session แยกกัน
- ✅ Login/Logout ไม่กระทบกัน
- ✅ ใช้งานได้พร้อมกันบน localhost

---

## 🗄️ Database Separation

### แยก Database แต่ละ Environment

**Development:**
```env
MONGODB_URI=mongodb://root:example@localhost:27017/Safem0de-gpt-dev?authSource=admin
```

**Staging:**
```env
MONGODB_URI=mongodb://root:example@localhost:27017/Safem0de-gpt-staging?authSource=admin
```

**Production:**
```env
MONGODB_URI=mongodb://root:example@localhost:27017/Safem0de-gpt?authSource=admin
```

**หรือใช้ port ต่างกัน:**
```bash
# Development: port 27017
docker run -p 27017:27017 mongo

# Staging: port 27018
docker run -p 27018:27017 mongo

# Production: port 27019
docker run -p 27019:27017 mongo
```

---

## 🔐 Keycloak Realms

### แยก Realm แต่ละ Environment

**Development:**
- Realm: `safem0de-gpt-dev`
- Port: 8080
- URL: `http://localhost:8080/realms/safem0de-gpt-dev`

**Staging:**
- Realm: `safem0de-gpt-staging`
- Port: 8081 (หรือใช้ realm ต่างกัน)
- URL: `http://localhost:8081/realms/safem0de-gpt-staging`

**Production:**
- Realm: `safem0de-gpt`
- Port: 8082
- URL: `http://localhost:8082/realms/safem0de-gpt`

---

## 🧪 Testing

### 1. ตรวจสอบ Cookie Names

**Chrome DevTools:**
1. F12 → Application → Cookies → `http://localhost:3000`
2. ดู cookie names:
   - ✅ `safem0de-gpt-dev.session-token`
   - ✅ `safem0de-gpt-dev.callback-url`
   - ✅ `safem0de-gpt-dev.csrf-token`

### 2. ทดสอบ Multi-Login

1. เปิด Dev (port 3000) → Login
2. เปิด Staging (port 3001) → ยังไม่ login (ถูกต้อง!)
3. Login ใน Staging → ไม่กระทบ Dev (ถูกต้อง!)

### 3. ทดสอบ Cookie Isolation

```javascript
// Console ใน port 3000
document.cookie
// "safem0de-gpt-dev.session-token=..."

// Console ใน port 3001
document.cookie
// "safem0de-gpt-staging.session-token=..."
```

---

## 📋 Checklist: Setup New Environment

- [ ] คัดลอก `.env.{environment}.example` → `.env.{environment}.local`
- [ ] ตั้งค่า `NEXTAUTH_COOKIE_PREFIX` ให้ unique
- [ ] ตั้งค่า `NEXTAUTH_URL` ให้ตรงกับ port
- [ ] ตั้งค่า `MONGODB_URI` ให้ชี้ database ที่ถูกต้อง
- [ ] ตั้งค่า Keycloak realm แยก (ถ้าต้องการ)
- [ ] เพิ่ม script ใน `package.json` (ถ้าต้องการ)
- [ ] ทดสอบ login/logout แยกกัน
- [ ] ตรวจสอบ cookie names ใน DevTools

---

## 🔍 Troubleshooting

### ปัญหา: Cookie ยังชนกัน

**สาเหตุ:** `NEXTAUTH_COOKIE_PREFIX` ไม่ได้ตั้งค่า

**แก้ไข:**
1. เช็ค `.env.local` ว่ามี `NEXTAUTH_COOKIE_PREFIX`
2. Restart dev server
3. Clear cookies ทั้งหมด (Ctrl+Shift+Delete)

### ปัญหา: Session หาย

**สาเหตุ:** เปลี่ยน cookie prefix ตอนที่ login อยู่

**แก้ไข:**
1. Logout ทุก app
2. Clear cookies
3. Login ใหม่

### ปัญหา: Environment ผิด

**สาเหตุ:** Next.js โหลด `.env.local` แทน `.env.development.local`

**แก้ไข:**
```bash
# ระบุ environment ชัดเจน
NODE_ENV=development npm run dev
NODE_ENV=staging npm run dev:staging
NODE_ENV=production npm run build && npm start
```

---

## 📚 Best Practices

1. **ใช้ Prefix ที่ชัดเจน**
   - ❌ `app1`, `app2`
   - ✅ `safem0de-gpt-dev`, `safem0de-gpt-staging`

2. **แยก Database แต่ละ Environment**
   - ป้องกัน data ผสมกัน
   - ทดสอบได้อิสระ

3. **ใช้ Git-ignored Files**
   - `.env.*.local` → ไม่ commit
   - `.env.*.example` → commit ได้

4. **Document Environment URLs**
   - Dev: http://localhost:3000
   - Staging: http://localhost:3001
   - Production: https://yourdomain.com

---

## 🎓 Advanced: Docker Compose

ถ้าต้องการรันทุก environment ด้วย Docker:

```yaml
# docker-compose.multi-env.yml
version: '3.8'

services:
  app-dev:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.development.local

  app-staging:
    build: .
    ports:
      - "3001:3000"
    env_file:
      - .env.staging.local

  app-prod:
    build: .
    ports:
      - "3002:3000"
    env_file:
      - .env.production.local
```

---

สร้างโดย Claude Code 🤖
