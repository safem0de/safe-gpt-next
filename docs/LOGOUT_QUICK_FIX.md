# ⚡ Quick Fix: Logout Error

## 🎯 สรุป 2 Error และวิธีแก้

### Error 1: Invalid parameter: redirect_uri
**สาเหตุ:** Keycloak ไม่รู้จัก redirect URI

**แก้:**
1. Keycloak Admin → Clients → safem0de-gpt-client
2. **Valid post logout redirect URIs** ใส่:
   ```
   http://localhost:3000/*
   http://localhost:3000
   +
   ```

### Error 2: Missing parameters: id_token_hint
**สาเหตุ:** ไม่มี `id_token` ส่งไปตอน logout

**แก้:** ตรวจสอบไฟล์ 3 ไฟล์นี้ได้รับการแก้ไขแล้ว

---

## ✅ Checklist - ตรวจสอบทุกข้อ!

### 1. Keycloak Settings
- [ ] Valid post logout redirect URIs มี `http://localhost:3000/*`
- [ ] Valid post logout redirect URIs มี `http://localhost:3000`
- [ ] Valid post logout redirect URIs มี `+`
- [ ] Web origins มี `+`
- [ ] กด **Save** แล้ว

### 2. Environment Variables
- [ ] `.env.local` มี `NEXT_PUBLIC_KEYCLOAK_ISSUER`
- [ ] URL ตรงกับ Keycloak realm URL

### 3. Code Changes
- [ ] `src/types/next-auth.d.ts` มี `idToken?: string` ใน Session
- [ ] `src/types/next-auth.d.ts` มี `idToken?: string` ใน JWT
- [ ] `src/app/api/auth/[...nextauth]/route.ts` เก็บ `token.idToken`
- [ ] `src/app/api/auth/[...nextauth]/route.ts` ส่ง `session.idToken`
- [ ] `src/components/Navbar.tsx` ดึง `idToken` จาก session
- [ ] `src/components/Navbar.tsx` ส่ง `id_token_hint` parameter

### 4. Testing
- [ ] Restart dev server (`npm run dev`)
- [ ] **Login ใหม่** (เพื่อได้ id_token ใหม่)
- [ ] ลอง logout → ต้องสำเร็จไม่มี error

---

## 🔍 Debug: ตรวจสอบ Logout URL

เปิด DevTools Console (F12) → พิมพ์:

```javascript
// ดู session
console.log('Session:', session);
console.log('ID Token:', session?.idToken);

// ดู logout URL ที่จะส่ง
const logoutUrl = new URL('http://localhost:8080/realms/safem0de-gpt/protocol/openid-connect/logout');
logoutUrl.searchParams.append('post_logout_redirect_uri', 'http://localhost:3000');
logoutUrl.searchParams.append('id_token_hint', session?.idToken || '');
console.log('Logout URL:', logoutUrl.toString());
```

**ควรเห็น:**
```
Logout URL: http://localhost:8080/realms/safem0de-gpt/protocol/openid-connect/logout?post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A3000&id_token_hint=eyJhbGciOiJSUzI1NiIsInR5cC...
```

---

## 🚨 ข้อผิดพลาดบ่อย

### ❌ ลืม Login ใหม่หลัง Restart
**ปัญหา:** Session เก่ายังไม่มี `id_token`

**แก้:** Logout → Login ใหม่

### ❌ Keycloak Setting ไม่ Save
**ปัญหา:** แก้แล้วแต่ลืมกด Save

**แก้:** เช็คอีกครั้งว่า setting บันทึกแล้ว

### ❌ Environment Variable ผิด
**ปัญหา:** URL ไม่ตรงกัน

**แก้:** เช็ค `.env.local` และ Keycloak URL ให้ตรงกัน

---

## 📱 Contact
ถ้ายังแก้ไม่ได้ ให้อ่าน [LOGOUT_FIX.md](./LOGOUT_FIX.md) ฉบับเต็ม
