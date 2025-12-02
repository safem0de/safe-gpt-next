🚀 วิธี Deploy บน Localhost
สร้าง Dockerfile ให้แล้ว ตอนนี้รันคำสั่งเหล่านี้:
1. Build Docker Image
docker build -t safe-gpt-next .
2. Run Container
docker run -d --name safe-gpt-next -p 3000:3000 safe-gpt-next
docker run -d --name safe-gpt-next -p 3000:3000 --env-file ./.env safe-gpt-next
1. เปิดบราวเซอร์
http://localhost:3000
1. ดู Logs
docker logs safe-gpt-next -f
คำสั่งที่เป็นประโยชน์:
# Stop container
docker stop safe-gpt-next

# Start container
docker start safe-gpt-next

# Restart container
docker restart safe-gpt-next

# Remove container
docker rm -f safe-gpt-next

# Remove image
docker rmi safe-gpt-next

# Rebuild (หลังแก้ code)
docker build -t safe-gpt-next .
docker rm -f safe-gpt-next
docker run -d --name safe-gpt-next -p 3000:3000 safe-gpt-next
เท่านี้ครับ! เรียบง่าย ไม่มีอะไรเพิ่ม 🎯
# Docker runtime env (fix NextAuth NO_SECRET)
- The image does not include your `.env` because it is ignored in `.dockerignore`. You must inject env vars at runtime.
- At minimum set `NEXTAUTH_SECRET` and `NEXTAUTH_URL`, plus your `KEYCLOAK_*` and `MONGODB_*` values.
- Example with an env file on the host:
  - `docker run -d --name safe-gpt-next -p 3000:3000 --env-file ./.env safe-gpt-next`
- Example with inline vars (replace values):
  - `docker run -d --name safe-gpt-next -p 3000:3000 -e NEXTAUTH_SECRET=... -e NEXTAUTH_URL=http://localhost:3000 safe-gpt-next`
- Generate a new secret for production: `./scripts/generate-secret.sh` (or `openssl rand -base64 32`).
