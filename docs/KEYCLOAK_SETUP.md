# 🔐 Keycloak Setup Guide

คู่มือการตั้งค่า Keycloak สำหรับ SafeM0de-GPT

## 📋 สารบัญ
1. [Prerequisites](#prerequisites)
2. [ติดตั้ง Keycloak](#ติดตั้ง-keycloak)
3. [สร้าง Realm](#1-สร้าง-realm)
4. [สร้าง Client](#2-สร้าง-client)
5. [สร้าง User](#3-สร้าง-user-ทดสอบ)
6. [ตั้งค่า Environment Variables](#4-ตั้งค่า-environment-variables)
7. [ทดสอบ](#5-ทดสอบ)

---****

## Prerequisites

- Docker และ Docker Compose (แนะนำ) หรือ
- Keycloak standalone server
- Next.js application รันอยู่ที่ `http://localhost:3000`

---

## ติดตั้ง Keycloak

### ใช้ Docker (แนะนำ)

สร้างไฟล์ `docker-compose.yml`:

```yaml
version: '3.8'

services:
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    container_name: keycloak
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: password
    ports:
      - "8080:8080"
    command: start-dev
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    container_name: keycloak-postgres
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

รัน Keycloak:
```bash
docker-compose up -d
```

เข้าใช้งานที่: `http://localhost:8080`
- Username: `admin`
- Password: `admin`

---

## 1. สร้าง Realm

1. เข้า Keycloak Admin Console: `http://localhost:8080`
2. Login ด้วย admin credentials (`admin` / `admin`)
3. คลิก dropdown ที่มุมบนซ้าย (ตรง "**master**")
4. คลิก **Create Realm**
5. ตั้งค่า:
   - **Realm name**: `safem0de-gpt`
   - ✅ **Enabled**: เปิด
6. คลิก **Create**

![Create Realm](https://i.imgur.com/example.png)

---

## 2. สร้าง Client

### 2.1 Create Client

1. เลือก Realm: **safem0de-gpt**
2. ไปที่เมนู **Clients** → คลิก **Create client**
3. **General Settings**:
   - **Client type**: `OpenID Connect`
   - **Client ID**: `safem0de-gpt-client`
   - คลิก **Next**

### 2.2 Capability Config

4. **Capability config**:
   - ✅ **Client authentication**: เปิด (สำคัญ!)
   - ✅ **Authorization**: เปิด (ถ้าต้องการ fine-grained permissions)
   - **Authentication flow**:
     - ✅ **Standard flow**: เปิด (Authorization Code Flow)
     - ✅ **Direct access grants**: เปิด (ถ้าต้องการ)
   - คลิก **Next**

### 2.3 Login Settings

5. **Login settings**:
   - **Root URL**: `http://localhost:3000`
   - **Home URL**: `http://localhost:3000`
   - **Valid redirect URIs**:
     ```
     http://localhost:3000/*
     http://localhost:3000/api/auth/callback/keycloak
     ```
   - **Valid post logout redirect URIs**:
     ```
     http://localhost:3000/*
     http://localhost:3000
     +
     ```
     **⚠️ สำคัญ!** ต้องใส่ทั้ง 3 แบบเพื่อให้ logout ทำงานได้ถูกต้อง
     - `http://localhost:3000/*` - รองรับ wildcard
     - `http://localhost:3000` - รองรับ exact match
     - `+` - รองรับทุก redirect URI ที่อยู่ใน Valid redirect URIs

   - **Web origins**:
     ```
     http://localhost:3000
     +
     ```
     **หมายเหตุ:** `+` หมายถึงอนุญาตทุก origin ที่อยู่ใน Valid redirect URIs

   - คลิก **Save**

### 2.4 Get Client Secret

6. ไปที่แท็บ **Credentials**
7. คัดลอก **Client secret**
8. บันทึกค่านี้ไว้ใน `.env.local`:
   ```env
   KEYCLOAK_CLIENT_SECRET=<your-client-secret>
   ```

**ตัวอย่าง Client Secret**: `xK9mP2nQ5vW8yA1bC4dE7fG0hI3jL6m`

---

## 3. สร้าง User (ทดสอบ)

### 3.1 Create User

1. เลือก Realm: **safem0de-gpt**
2. ไปที่เมนู **Users** → คลิก **Create new user**
3. ตั้งค่า:
   - **Username**: `testuser`
   - **Email**: `test@example.com`
   - **First name**: `Test`
   - **Last name**: `User`
   - ✅ **Email verified**: เปิด (สำคัญ!)
   - ✅ **Enabled**: เปิด
4. คลิก **Create**

### 3.2 Set Password

5. ไปที่แท็บ **Credentials**
6. คลิก **Set password**
7. ตั้งค่า:
   - **Password**: `Test123!`
   - **Password confirmation**: `Test123!`
   - ❌ **Temporary**: ปิด (ไม่ต้องเปลี่ยนรหัสผ่านตอน login ครั้งแรก)
8. คลิก **Save**

---

## 4. ตั้งค่า Environment Variables

### 4.1 สร้าง NextAuth Secret

รันคำสั่งนี้เพื่อสร้าง secret:

```bash
openssl rand -base64 32
```

**ตัวอย่างผลลัพธ์**: `oPCxIFMoeDMg96lZDJ5JXzNjsfiY4W6m0swMBYNMMG8=`

### 4.2 อัปเดท .env.local

แก้ไขไฟล์ `.env.local`:

```env
# Keycloak Configuration
KEYCLOAK_CLIENT_ID=safem0de-gpt-client
KEYCLOAK_CLIENT_SECRET=<คัดลอกจาก Keycloak Credentials>
KEYCLOAK_ISSUER=http://localhost:8080/realms/safem0de-gpt

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<สร้างใหม่ด้วย openssl rand -base64 32>

# Public Environment Variables
NEXT_PUBLIC_KEYCLOAK_LOGOUT_URL=http://localhost:8080/realms/safem0de-gpt/protocol/openid-connect/logout?redirect_uri=http://localhost:3000
```

### 4.3 Restart Next.js Dev Server

```bash
# หยุด dev server ปัจจุบัน (Ctrl+C)
npm run dev
```

---

## 5. ทดสอบ

### 5.1 ทดสอบ Login Flow

1. เข้า `http://localhost:3000`
2. คลิกปุ่ม **Sign In** (ที่ Navbar หรือ Sidebar)
3. จะถูก redirect ไปหน้า Keycloak login
4. Login ด้วย:
   - **Username**: `testuser`
   - **Password**: `Test123!`
5. ถ้าสำเร็จจะกลับมาหน้า app พร้อม avatar ที่มุมบนขวา

### 5.2 ทดสอบ User Info

1. คลิก Avatar ที่มุมบนขวา
2. ควรเห็น:
   - ชื่อ: **Test User**
   - Email: **test@example.com**
   - เมนู: Profile, Settings
   - ปุ่ม Logout

### 5.3 ทดสอบ Logout

1. คลิก **Logout**
2. จะถูก logout ทั้งจาก NextAuth และ Keycloak
3. กลับมาที่หน้าแรก

### 5.4 ทดสอบ Chat History

1. Login แล้วลองสร้างแชทใหม่
2. ตรวจสอบว่า chat history แสดงเฉพาะของ user ที่ login
3. Logout แล้ว login ด้วย user อื่น → chat history ต้องแตกต่างกัน

---

## 🔧 Troubleshooting

### ปัญหา: Logout Error - Invalid parameter: redirect_uri

**Error**: `We are sorry... Invalid parameter: redirect_uri` ตอน logout

**สาเหตุ**: Keycloak ไม่ยอมรับ `post_logout_redirect_uri` ที่ส่งไป

**วิธีแก้**:
1. ไปที่ Keycloak Admin Console → Clients → `safem0de-gpt-client`
2. ตรวจสอบ **Valid post logout redirect URIs** ต้องมี:
   ```
   http://localhost:3000/*
   http://localhost:3000
   +
   ```
3. คลิก **Save**
4. ตรวจสอบว่า `.env.local` มีค่า:
   ```env
   NEXT_PUBLIC_KEYCLOAK_ISSUER=http://localhost:8080/realms/safem0de-gpt
   ```
5. Restart Next.js dev server: `npm run dev`
6. ลอง logout อีกครั้ง

**หมายเหตุ**:
- ใช้ `+` จะทำให้ Keycloak อนุญาตทุก URI ที่อยู่ใน Valid redirect URIs
- ถ้ายังไม่ได้ ลองใส่ exact URL: `http://localhost:3000`

### ปัญหา: Login Redirect URI mismatch

**Error**: `Invalid parameter: redirect_uri` ตอน login

**วิธีแก้**:
1. เช็ค **Valid redirect URIs** ใน Keycloak Client settings
2. ต้องมี:
   ```
   http://localhost:3000/*
   http://localhost:3000/api/auth/callback/keycloak
   ```
3. คลิก **Save**

### ปัญหา: Client authentication failed

**Error**: `Client authentication failed`

**วิธีแก้**:
1. เช็คว่า `KEYCLOAK_CLIENT_SECRET` ใน `.env.local` ถูกต้อง
2. ตรวจสอบว่า Client authentication เปิดอยู่ใน Keycloak

### ปัญหา: Session ไม่ persist

**Error**: Session หายไปเมื่อ refresh หน้า

**วิธีแก้**:
1. เช็คว่า `NEXTAUTH_SECRET` ตั้งค่าแล้ว
2. Restart Next.js dev server

### ปัญหา: CORS Error

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**วิธีแก้**:
1. เพิ่ม `http://localhost:3000` ใน Web origins ของ Client
2. Restart Keycloak (ถ้าจำเป็น)

---

## 📚 Advanced Configuration

### Custom User Attributes

1. ไปที่ **Realm settings** → **User profile**
2. เพิ่ม custom attributes
3. สร้าง Protocol Mapper ใน Client เพื่อส่ง attributes ไปใน token

### Role-Based Access Control (RBAC)

1. ไปที่ **Realm roles** → สร้าง roles (เช่น `admin`, `user`)
2. Assign roles ให้ users
3. ใช้ `session.user.roles` ใน Next.js เพื่อตรวจสอบ permissions

### Token Customization

1. ไปที่ Client → **Client scopes** → **Dedicated scope**
2. สร้าง Mapper เพื่อเพิ่มข้อมูลใน token
3. อัปเดท NextAuth callback เพื่อดึงข้อมูลเพิ่มเติม

---

## 📖 เอกสารเพิ่มเติม

- [Keycloak Official Docs](https://www.keycloak.org/documentation)
- [NextAuth.js Keycloak Provider](https://next-auth.js.org/providers/keycloak)
- [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html)

---

## ✅ Checklist

- [ ] Keycloak รันอยู่ที่ http://localhost:8080
- [ ] สร้าง Realm: `safem0de-gpt`
- [ ] สร้าง Client: `safem0de-gpt-client`
- [ ] ตั้งค่า Valid redirect URIs
- [ ] คัดลอก Client Secret
- [ ] สร้าง Test User พร้อม password
- [ ] สร้าง NextAuth Secret
- [ ] อัปเดท .env.local
- [ ] Restart Next.js dev server
- [ ] ทดสอบ login/logout
- [ ] ทดสอบ chat history ของแต่ละ user

---

สร้างโดย Claude Code 🤖
