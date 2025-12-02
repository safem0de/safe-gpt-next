# POC Deployment Guide - Deploy to Localhost

คู่มือการ Deploy แบบ POC (Proof of Concept) ไปที่ localhost เพื่อทดสอบก่อนขึ้น production

## 🎯 สิ่งที่จะได้

1. GitHub Actions build Docker image และ push ไปที่ GHCR
2. Pull image จาก GHCR มารันบน localhost ของคุณ
3. ทดสอบว่า workflow ทำงานได้จริง

## 📋 Prerequisites

### 1. ติดตั้ง Docker Desktop
- Windows/Mac: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
- Linux:
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  ```

### 2. สร้าง GitHub Personal Access Token (PAT)
1. ไปที่ GitHub Settings → Developer settings → [Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. ใส่ชื่อ: `GHCR Access`
4. เลือก scopes:
   - ✅ `read:packages` (อ่าน packages)
   - ✅ `write:packages` (เขียน packages)
   - ✅ `delete:packages` (ลบ packages - optional)
5. Generate token และ **เก็บไว้ดีๆ**

## 🚀 ขั้นตอนการ Deploy

### Step 1: Push Code ไป GitHub

```bash
git add .
git commit -m "Setup Docker deployment"
git push origin master
```

GitHub Actions จะ:
- ✅ Build Docker image
- ✅ Push ไปที่ GHCR (GitHub Container Registry)

ดูได้ที่: Repository → Actions tab

### Step 2: สร้างไฟล์ Environment Variables

สร้างไฟล์ `.env.production` ใน root directory:

```bash
# Copy template
cp .env.production.example .env.production

# Edit with your values
nano .env.production  # or use your favorite editor
```

ใส่ค่าเหล่านี้:

```env
MONGODB_URI=mongodb://localhost:27017/safe-gpt
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-below
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key
NODE_ENV=production
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### Step 3: Login to GitHub Container Registry

```bash
# Replace YOUR_USERNAME and YOUR_PAT
echo 'YOUR_GITHUB_PAT' | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

ตัวอย่าง:
```bash
echo 'ghp_xxxxxxxxxxxxxxxxxxxx' | docker login ghcr.io -u safem0de --password-stdin
```

### Step 4: Deploy to Localhost

#### วิธีที่ 1: ใช้ Script (แนะนำ)

```bash
./scripts/deploy-local.sh
```

Script จะ:
- ✅ ตรวจสอบ Docker
- ✅ ตรวจสอบ .env.production
- ✅ Pull image จาก GHCR
- ✅ Stop container เก่า
- ✅ Run container ใหม่
- ✅ ตรวจสอบ health check
- ✅ Clean up old images

#### วิธีที่ 2: รัน Manual

```bash
# Pull latest image
docker pull ghcr.io/YOUR_USERNAME/safe-gpt-next:latest

# Stop old container
docker stop safe-gpt-next 2>/dev/null || true
docker rm safe-gpt-next 2>/dev/null || true

# Run new container
docker run -d \
  --name safe-gpt-next \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  ghcr.io/YOUR_USERNAME/safe-gpt-next:latest

# Check logs
docker logs safe-gpt-next -f
```

### Step 5: ทดสอบ

เปิดบราวเซอร์:
- Application: http://localhost:3000
- Health Check: http://localhost:3000/api/health

## 📊 Monitoring

### ดู Logs
```bash
# Real-time logs
docker logs safe-gpt-next -f

# Last 100 lines
docker logs safe-gpt-next --tail 100
```

### ตรวจสอบ Container
```bash
# List running containers
docker ps

# Container stats
docker stats safe-gpt-next

# Inspect container
docker inspect safe-gpt-next
```

### เข้าไปใน Container
```bash
docker exec -it safe-gpt-next sh
```

## 🔄 Update Deployment

เมื่อมีการเปลี่ยนแปลง code:

```bash
# 1. Push to GitHub
git add .
git commit -m "Update feature"
git push origin master

# 2. Wait for GitHub Actions to build (1-2 minutes)

# 3. Deploy ใหม่
./scripts/deploy-local.sh
```

## 🛠️ Useful Commands

### Restart Container
```bash
docker restart safe-gpt-next
```

### Stop Container
```bash
docker stop safe-gpt-next
```

### Remove Container
```bash
docker rm -f safe-gpt-next
```

### View Image Info
```bash
docker images | grep safe-gpt-next
```

### Clean Up Everything
```bash
# Remove all containers and images
docker rm -f safe-gpt-next
docker rmi ghcr.io/YOUR_USERNAME/safe-gpt-next:latest
docker system prune -af
```

## 🐛 Troubleshooting

### Container ไม่ start

```bash
# ดู logs
docker logs safe-gpt-next

# ตรวจสอบ environment variables
docker exec safe-gpt-next env
```

### Cannot pull image from GHCR

```bash
# ตรวจสอบว่า login แล้ว
docker info | grep ghcr.io

# Login ใหม่
echo 'YOUR_PAT' | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### Port 3000 already in use

```bash
# หา process ที่ใช้ port 3000
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000

# หรือเปลี่ยน port
docker run -d \
  --name safe-gpt-next \
  -p 3001:3000 \
  ...
```

### Health check fails

ตรวจสอบว่ามี [app/api/health/route.ts](app/api/health/route.ts) แล้ว

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Should return:
# {"status":"ok","timestamp":"...","uptime":...}
```

### GHCR image is private

ทำให้เป็น public:
1. ไปที่ GitHub repository
2. Packages → safe-gpt-next
3. Package settings → Change visibility → Public

## 📝 Workflow Explanation

### GitHub Actions Workflow: [.github/workflows/deploy-local.yml](.github/workflows/deploy-local.yml)

```yaml
on:
  push:
    branches: [master, main, dev]  # Trigger on push
```

Jobs:
1. **build-and-push**: Build Docker image → Push to GHCR
2. **deploy-local**: สร้าง deployment script artifact

### ดาวน์โหลด Deployment Script จาก Actions

1. ไปที่ Actions tab
2. เลือก workflow run
3. Scroll ลงไปหา "Artifacts"
4. Download "deployment-script"
5. Extract และรัน `./deploy.sh`

## 🎓 Next Steps

หลังจากทดสอบ POC สำเร็จ:

1. ✅ ทดสอบทุก features ให้ครบ
2. ✅ ตรวจสอบ performance
3. ✅ ทดสอบ environment variables
4. ✅ ทดสอบการ restart container

พร้อมแล้ว → ใช้ [DEPLOYMENT.md](DEPLOYMENT.md) สำหรับ deploy ไปที่ EC2 production

## 🔐 Security Notes

- ⚠️ **NEVER** commit `.env.production` to git
- ⚠️ **NEVER** commit GitHub PAT to git
- ⚠️ ใช้ `.gitignore` เพื่อป้องกันไฟล์ sensitive
- ⚠️ Rotate secrets เป็นประจำ

## 💡 Tips

1. **Use specific tags**: แทนที่จะใช้ `latest` ใช้ tags เช่น `v1.0.0`
2. **Monitor logs**: ดู logs บ่อยๆ เพื่อหา errors
3. **Test health endpoint**: ใช้ health check เพื่อตรวจสอบว่า app ทำงานปกติ
4. **Backup data**: Backup MongoDB data ก่อน update
5. **Use docker-compose**: สำหรับ multi-container setup (database, cache, etc.)

## 📚 Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Packages](https://docs.github.com/en/packages)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [README.Docker.md](README.Docker.md) - Docker basics
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
