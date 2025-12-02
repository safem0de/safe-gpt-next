# Deployment Resources

โฟลเดอร์นี้รวบรวมทุกอย่างที่เกี่ยวกับการ Deploy แอปพลิเคชัน

## 📁 โครงสร้าง

```
deployment/
├── docker/                      # Docker configuration files
│   ├── Dockerfile              # Multi-stage Dockerfile for production
│   ├── .dockerignore           # Files to exclude from Docker build
│   └── docker-compose.yml      # Compose file for manual deployment
│
├── scripts/                     # Deployment scripts
│   ├── deploy-local.sh         # Script for deploying to localhost
│   └── setup-ec2.sh            # Script for setting up EC2 instance
│
├── docs/                        # Documentation
│   ├── POC-DEPLOYMENT.md       # Guide for POC deployment to localhost
│   ├── DEPLOYMENT.md           # Guide for production deployment to EC2
│   └── README.Docker.md        # Docker basics and usage
│
├── .env.production.example      # Example environment variables
└── README.md                    # This file
```

## 🚀 Quick Start

### สำหรับ POC (Deploy to Localhost)
```bash
# 1. อ่านคู่มือ
cat deployment/docs/POC-DEPLOYMENT.md

# 2. รัน deployment script
./deployment/scripts/deploy-local.sh
```

### สำหรับ Production (Deploy to EC2)
```bash
# 1. อ่านคู่มือ
cat deployment/docs/DEPLOYMENT.md

# 2. Setup EC2
./deployment/scripts/setup-ec2.sh

# 3. Push code (GitHub Actions จะ deploy อัตโนมัติ)
git push origin master
```

## 📚 Documentation

- **[POC-DEPLOYMENT.md](docs/POC-DEPLOYMENT.md)** - วิธี deploy ไปที่ localhost เพื่อทดสอบ
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - วิธี deploy ไปที่ EC2 production
- **[README.Docker.md](docs/README.Docker.md)** - พื้นฐาน Docker และคำสั่งที่ใช้บ่อย

## 🐳 Docker Files

### Dockerfile
Multi-stage build สำหรับ production:
- Stage 1: Dependencies
- Stage 2: Builder
- Stage 3: Runner (final image)

### docker-compose.yml
สำหรับรัน manual deployment:
```bash
cd deployment/docker
docker-compose up -d
```

## 🔧 Scripts

### deploy-local.sh
Deploy ไปที่ localhost อัตโนมัติ:
- ตรวจสอบ Docker installation
- Login to GHCR
- Pull latest image
- Deploy container
- Health check

### setup-ec2.sh
ติดตั้ง Docker บน EC2:
- Install Docker
- Install Docker Compose
- Setup directories
- Create env template

## 🔐 Environment Variables

Copy และแก้ไข:
```bash
cp deployment/.env.production.example .env.production
nano .env.production
```

ตัวแปรที่จำเป็น:
- `MONGODB_URI` - MongoDB connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `OPENAI_API_KEY` - OpenAI API key
- และอื่นๆ (ดูใน .env.production.example)

## 🌐 Deployment Workflows

### GitHub Actions

**Auto Deploy to EC2**: [.github/workflows/deploy.yml](../.github/workflows/deploy.yml)
- Trigger: Push to master/main
- Build → Push to GHCR → Deploy to EC2

**POC Deployment**: [.github/workflows/deploy-local.yml](../.github/workflows/deploy-local.yml)
- Trigger: Push to master/main/dev
- Build → Push to GHCR → Create deployment artifact

## 💡 Tips

1. **ทดสอบ local ก่อน** - ใช้ POC deployment ทดสอบให้แน่ใจก่อน deploy production
2. **ใช้ .env.production** - แยกไฟล์ env สำหรับแต่ละ environment
3. **Monitor logs** - ดู logs บ่อยๆ หลัง deployment
4. **Health checks** - ใช้ health endpoint ตรวจสอบสถานะ app

## 🆘 Support

มีปัญหา? ดูที่:
- [POC-DEPLOYMENT.md - Troubleshooting](docs/POC-DEPLOYMENT.md#-troubleshooting)
- [DEPLOYMENT.md - Troubleshooting](docs/DEPLOYMENT.md#troubleshooting)
- [README.Docker.md - Common Issues](docs/README.Docker.md#troubleshooting)
