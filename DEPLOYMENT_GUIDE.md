# 🚀 Deployment Guide

คู่มือสำหรับการ Deploy Safe GPT Next แบบครบถ้วน

## 📁 โครงสร้างไฟล์

```
safe-gpt-next/
├── deployment/                  # 📦 ทุกอย่างเกี่ยวกับ deployment
│   ├── docker/                  # Docker configuration
│   │   ├── Dockerfile
│   │   ├── .dockerignore
│   │   └── docker-compose.yml
│   │
│   ├── scripts/                 # Deployment scripts
│   │   ├── deploy-local.sh      # Deploy to localhost
│   │   └── setup-ec2.sh         # Setup EC2 instance
│   │
│   ├── docs/                    # Documentation
│   │   ├── POC-DEPLOYMENT.md    # POC deployment guide
│   │   ├── DEPLOYMENT.md        # Production deployment
│   │   └── README.Docker.md     # Docker basics
│   │
│   ├── .env.production.example  # Environment variables template
│   └── README.md                # Deployment overview
│
└── .github/workflows/           # CI/CD pipelines
    ├── deploy.yml               # Auto deploy to EC2
    └── deploy-local.yml         # Build for local deployment
```

## 🎯 เลือกวิธี Deploy

### 1. 🏠 POC Deployment (Localhost)
**สำหรับ**: ทดสอบ, Development, POC
**เวลา**: ~5-10 นาที

```bash
# อ่านคู่มือ
cat deployment/docs/POC-DEPLOYMENT.md

# Deploy
./deployment/scripts/deploy-local.sh
```

👉 [คู่มือละเอียด: POC-DEPLOYMENT.md](deployment/docs/POC-DEPLOYMENT.md)

---

### 2. ☁️ Production Deployment (EC2)
**สำหรับ**: Production, Staging
**เวลา**: ~15-30 นาที (setup ครั้งแรก)

```bash
# อ่านคู่มือ
cat deployment/docs/DEPLOYMENT.md

# Setup EC2 (ครั้งแรก)
./deployment/scripts/setup-ec2.sh

# Deploy (อัตโนมัติผ่าน GitHub Actions)
git push origin master
```

👉 [คู่มือละเอียด: DEPLOYMENT.md](deployment/docs/DEPLOYMENT.md)

---

### 3. 🐳 Manual Docker Deployment
**สำหรับ**: Custom setup, Manual control

```bash
# Build image
docker build -f deployment/docker/Dockerfile -t safe-gpt-next .

# Run container
docker run -d \
  --name safe-gpt-next \
  -p 3000:3000 \
  --env-file .env.production \
  safe-gpt-next
```

👉 [คู่มือละเอียด: README.Docker.md](deployment/docs/README.Docker.md)

---

## 🚦 Quick Start

### สำหรับผู้เริ่มต้น (POC)

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/safe-gpt-next.git
cd safe-gpt-next

# 2. Setup environment
cp deployment/.env.production.example .env.production
nano .env.production  # แก้ไขค่าตามต้องการ

# 3. Login to GitHub Container Registry
echo 'YOUR_GITHUB_PAT' | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 4. Deploy
./deployment/scripts/deploy-local.sh

# 5. เปิดบราวเซอร์
open http://localhost:3000
```

### สำหรับ Production (EC2)

```bash
# 1. Setup GitHub Secrets
# ไปที่ GitHub → Settings → Secrets and variables → Actions
# เพิ่ม: EC2_HOST, EC2_USERNAME, EC2_SSH_KEY

# 2. SSH to EC2 และ setup
ssh ubuntu@YOUR_EC2_IP
./deployment/scripts/setup-ec2.sh

# 3. Push to GitHub
git push origin master

# 4. GitHub Actions จะ deploy อัตโนมัติ ✨
```

---

## 📚 Documentation

| คู่มือ | จุดประสงค์ | เหมาะสำหรับ |
|-------|----------|------------|
| [POC-DEPLOYMENT.md](deployment/docs/POC-DEPLOYMENT.md) | Deploy to localhost | Testing, POC, Local dev |
| [DEPLOYMENT.md](deployment/docs/DEPLOYMENT.md) | Deploy to EC2 | Production, Staging |
| [README.Docker.md](deployment/docs/README.Docker.md) | Docker basics | เรียนรู้ Docker |
| [deployment/README.md](deployment/README.md) | Deployment overview | ภาพรวม deployment |

---

## 🔧 Environment Variables

สร้างไฟล์ `.env.production`:

```bash
cp deployment/.env.production.example .env.production
```

ตัวแปรที่จำเป็น:

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# OAuth (ถ้าใช้)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# AI APIs
OPENAI_API_KEY=sk-your-api-key
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## 🌊 Deployment Flow

### GitHub Actions Auto Deploy

```mermaid
graph LR
    A[Push to GitHub] --> B[GitHub Actions]
    B --> C[Build Docker Image]
    C --> D[Push to GHCR]
    D --> E[SSH to EC2]
    E --> F[Pull Image]
    F --> G[Deploy Container]
    G --> H[Health Check]
```

**Workflows:**
- [deploy.yml](.github/workflows/deploy.yml) - Auto deploy to EC2
- [deploy-local.yml](.github/workflows/deploy-local.yml) - Build for local

---

## 🛠️ Common Commands

### Local Development
```bash
# Deploy
./deployment/scripts/deploy-local.sh

# View logs
docker logs safe-gpt-next -f

# Restart
docker restart safe-gpt-next

# Stop
docker stop safe-gpt-next
```

### Production (EC2)
```bash
# SSH to EC2
ssh -i key.pem ubuntu@EC2_IP

# View logs
docker logs safe-gpt-next -f

# Restart
docker restart safe-gpt-next

# Manual deploy
cd ~/safe-gpt-next
docker-compose pull
docker-compose up -d
```

---

## 🔍 Health Checks

API Endpoint: `/api/health`

```bash
# Local
curl http://localhost:3000/api/health

# Production
curl http://YOUR_DOMAIN:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

---

## 🐛 Troubleshooting

### Container ไม่ start
```bash
# Check logs
docker logs safe-gpt-next

# Check if port is in use
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows
```

### Cannot pull from GHCR
```bash
# Re-login
echo 'YOUR_PAT' | docker login ghcr.io -u USERNAME --password-stdin

# Check image exists
docker pull ghcr.io/USERNAME/safe-gpt-next:latest
```

### GitHub Actions fails
1. Check GitHub Secrets are set correctly
2. Verify EC2 security group allows SSH
3. Check EC2 instance is running
4. Review Actions logs

---

## 🔐 Security Checklist

- [ ] `.env.production` is in `.gitignore`
- [ ] GitHub PAT has minimal required permissions
- [ ] EC2 Security Group allows only necessary ports
- [ ] SSH key is stored securely in GitHub Secrets
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] API keys are valid and not committed to git
- [ ] Docker image is regularly updated
- [ ] Health check endpoint is working

---

## 📞 Support

มีปัญหา? ดูที่:

1. **Troubleshooting sections** ในแต่ละคู่มือ
2. **GitHub Actions logs** ใน Actions tab
3. **Docker logs**: `docker logs safe-gpt-next`
4. **EC2 system logs**: `journalctl -xe`

---

## 🎓 Next Steps

หลังจาก deploy สำเร็จ:

1. ✅ ทดสอบทุก features
2. ✅ Setup monitoring (CloudWatch, Datadog, etc.)
3. ✅ Setup SSL/TLS (Let's Encrypt)
4. ✅ Setup reverse proxy (Nginx)
5. ✅ Setup CI/CD tests
6. ✅ Setup backup strategy
7. ✅ Setup error tracking (Sentry)
8. ✅ Setup logging (CloudWatch Logs)

---

**Happy Deploying! 🚀**
