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
### NO SQL database (connection)
npm i mongoose
mongodb://root:example@localhost:32017
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
---
### mongodb update user (need to update using admin)
```bash
use safem0de-gpt
db.updateUser("user-123", { pwd: "12345679" })
```