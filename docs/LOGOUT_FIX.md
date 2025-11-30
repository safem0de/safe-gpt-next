# 🔧 แก้ปัญหา Logout Error

## ❌ ปัญหาที่พบ

### Error 1: Invalid parameter: redirect_uri
```
We are sorry...
Invalid parameter: redirect_uri
```

### Error 2: Missing parameters: id_token_hint
```
We are sorry...
Missing parameters: id_token_hint
```

---

## ✅ วิธีแก้ (3 ขั้นตอน)

### 1️⃣ ตั้งค่า Keycloak

1. เข้า Keycloak Admin Console: http://localhost:8080
2. Login: `admin` / `admin`
3. เลือก Realm: **safem0de-gpt**
4. ไปที่ **Clients** → คลิก **safem0de-gpt-client**
5. Scroll ลงมาหา **Valid post logout redirect URIs**
6. ใส่ค่าทั้ง 3 บรรทัดนี้:
   ```
   http://localhost:3000/*
   http://localhost:3000
   +
   ```

   **คำอธิบาย:**
   - `http://localhost:3000/*` - รองรับ wildcard (ทุก path)
   - `http://localhost:3000` - exact match
   - `+` - รองรับทุก URI ที่อยู่ใน Valid redirect URIs

7. ตรวจสอบ **Web origins** ว่ามี:
   ```
   http://localhost:3000
   +
   ```

8. คลิก **Save**

---

### 2️⃣ ตรวจสอบ Environment Variables

ตรวจสอบไฟล์ `.env.local` ว่ามีค่าเหล่านี้:

```env
# Keycloak Issuer (สำหรับ client-side)
NEXT_PUBLIC_KEYCLOAK_ISSUER=http://localhost:8080/realms/safem0de-gpt

# NextAuth URL
NEXTAUTH_URL=http://localhost:3000

# Keycloak Configuration
KEYCLOAK_CLIENT_ID=safem0de-gpt-client
KEYCLOAK_CLIENT_SECRET=<your-secret-here>
KEYCLOAK_ISSUER=http://localhost:8080/realms/safem0de-gpt
```

**⚠️ สำคัญ:** `NEXT_PUBLIC_KEYCLOAK_ISSUER` ต้อง**ตรงกับ** `KEYCLOAK_ISSUER`

---

### 3️⃣ ตรวจสอบโค้ดที่แก้ไข

**สำคัญ!** ตรวจสอบว่าไฟล์เหล่านี้ได้รับการอัปเดทแล้ว:

#### 1. `src/types/next-auth.d.ts`
ต้องมี `idToken` ใน Session และ JWT types:
```typescript
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;  // ← ต้องมี!
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;      // ← ต้องมี!
    refreshToken?: string;
  }
}
```

#### 2. `src/app/api/auth/[...nextauth]/route.ts`
Callback ต้องเก็บ `id_token`:
```typescript
callbacks: {
  async jwt({ token, account, profile }) {
    if (account) {
      token.accessToken = account.access_token;
      token.idToken = account.id_token;  // ← ต้องมี!
      token.refreshToken = account.refresh_token;
    }
    // ...
  },
  async session({ session, token }) {
    session.accessToken = token.accessToken as string | undefined;
    session.idToken = token.idToken as string | undefined;  // ← ต้องมี!
    // ...
  },
}
```

#### 3. `src/components/Navbar.tsx`
handleLogout ต้องส่ง `id_token_hint`:
```typescript
const handleLogout = async () => {
  const idToken = session?.idToken;  // ← เก็บ id_token ก่อน signOut

  await signOut({ redirect: false });

  const logoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`);
  logoutUrl.searchParams.append("post_logout_redirect_uri", postLogoutRedirectUri);

  if (idToken) {
    logoutUrl.searchParams.append("id_token_hint", idToken);  // ← ต้องส่ง!
  }

  window.location.href = logoutUrl.toString();
};
```

---

### 4️⃣ Restart Application

```bash
# หยุด dev server (Ctrl+C)
npm run dev
```

**⚠️ สำคัญ:** ต้อง **login ใหม่** หลัง restart เพื่อให้ได้ `id_token` ใหม่!

---

## 🧪 ทดสอบ

1. เข้า http://localhost:3000
2. Login ด้วย `testuser` / `Test123!`
3. คลิก Avatar ที่มุมบนขวา
4. คลิก **Logout**
5. ✅ ควรถูก redirect กลับไปที่ http://localhost:3000 โดยไม่มี error

---

## 🔍 Debug Tips

### ตรวจสอบ Logout URL

เปิด Browser DevTools (F12) → Console → พิมพ์:

```javascript
// ดู environment variables
console.log('Issuer:', process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER);
console.log('Origin:', window.location.origin);
```

### ตรวจสอบ Network Request

1. เปิด DevTools → Network tab
2. คลิก Logout
3. ดู request ที่ไปหา `/protocol/openid-connect/logout`
4. ตรวจสอบ query parameters:
   - `post_logout_redirect_uri` ควรเป็น `http://localhost:3000`

---

## 📊 Checklist

- [ ] Valid post logout redirect URIs มีครบ 3 บรรทัด (`/*`, exact, `+`)
- [ ] Web origins มี `+`
- [ ] `.env.local` มี `NEXT_PUBLIC_KEYCLOAK_ISSUER`
- [ ] Restart Next.js dev server แล้ว
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] ลอง logout อีกครั้ง

---

## 🎯 Alternative: วิธีแก้ด่วน (Temporary)

ถ้ายังแก้ไม่ได้ ใช้วิธีนี้ชั่วคราว:

### แก้ไขโค้ด Navbar.tsx

เปลี่ยน `handleLogout` เป็น:

```typescript
const handleLogout = async () => {
  // Just logout from NextAuth, don't redirect to Keycloak
  await signOut({ callbackUrl: "/" });
};
```

**ข้อเสีย:** วิธีนี้จะ logout เฉพาะจาก NextAuth เท่านั้น ไม่ได้ logout จาก Keycloak session

---

## 🆘 ยังแก้ไม่ได้?

### ตรวจสอบ Keycloak Logs

```bash
# ถ้าใช้ Docker
docker logs safem0de-keycloak -f

# ดู error messages
```

### ตรวจสอบ Keycloak Version

```bash
docker exec safem0de-keycloak /opt/keycloak/bin/kc.sh --version
```

แนะนำ: Keycloak >= 22.0.0

---

## 📚 เอกสารเพิ่มเติม

- [KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md) - คู่มือครบถ้วน
- [Keycloak OIDC Logout](https://www.keycloak.org/docs/latest/securing_apps/index.html#logout)
- [NextAuth Keycloak Provider](https://next-auth.js.org/providers/keycloak)

---

สร้างโดย Claude Code 🤖
