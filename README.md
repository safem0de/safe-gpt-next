### Create Project
```bash
D:\Nextjs>npx create-next-app@latest
√ What is your project named? ... safe-gpt-next
√ Would you like to use TypeScript? ... Yes
√ Would you like to use ESLint? ... No
√ Would you like to use Tailwind CSS? ... Yes
√ Would you like your code inside a `src/` directory? ...  Yes
√ Would you like to use App Router? (recommended) ... Yes
√ Would you like to use Turbopack for `next dev`? ... No
√ Would you like to customize the import alias (`@/*` by default)? ... Yes
√ What import alias would you like configured? ... @/*
```
---
## Example
### NO SQL database (connection)
```bash
npm i mongoose
mongodb://root:examplepassword@localhost:32017
```
test connection
1. download mongosh
2. paste your connection string
---
### mongodb create new database with collection name
สร้าง Database และ Collection
```bash
use mydb
db.createCollection("tests")
```
เพิ่ม Document (ทดลอง insert ข้อมูลแรก)
```bash
db.tests.insertOne({ userId: "user001", messages: [] })
```
---
### mongodb create new user
```bash
use admin
db.createUser({
  user: "myuser",
  pwd: "mypassword",
  roles: [{ role: "readWrite", db: "yourdatabasename" }]
})
```
หรือ ให้สิทธิ์ทุก database
```bash
db.createUser({
  user: "myuser",
  pwd: "mypassword",
  roles: [{ role: "readWriteAnyDatabase", db: "admin" }]
})
```
---
### mongodb update(pwd) user (need to update using admin)
```bash
use safem0de-gpt
db.updateUser("user-123", { pwd: "newpassword" })
```

### KeyCloak
```bash
KEYCLOAK_ISSUER=http://localhost:32080/realms/<your-realm>
```

```bash
NEXT_PUBLIC_KEYCLOAK_LOGOUT_URL=http://<localhost>:<port,8080>/realms/<your-realm>/protocol/openid-connect/logout?redirect_uri=http://localhost:3000
```

### SonarQube
```bash
npx sonar-scanner
```