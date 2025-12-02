# Deployment Guide - GHCR to EC2 Auto Deploy

This guide explains how to set up automatic deployment from GitHub Container Registry (GHCR) to EC2.

## Architecture

```
Push to GitHub (master/main)
    ↓
GitHub Actions
    ↓
Build Docker Image → Push to GHCR
    ↓
SSH to EC2 → Pull Image → Deploy
```

## Prerequisites

### 1. EC2 Instance
- Ubuntu 20.04 or later
- Security Group with ports:
  - 22 (SSH)
  - 3000 (Application)
  - 80/443 (Optional - for reverse proxy)
- SSH key pair for access

### 2. GitHub Repository
- Repository with this codebase
- GitHub Actions enabled
- Packages (GHCR) enabled

## Setup Steps

### Step 1: Prepare EC2 Instance

SSH into your EC2 instance:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

Run the setup script:
```bash
# Download and run the setup script
curl -o setup-ec2.sh https://raw.githubusercontent.com/YOUR_USERNAME/safe-gpt-next/master/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

Or manually follow these steps:
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes to take effect
exit
```

### Step 2: Configure EC2 Environment

```bash
# Create deployment directory
mkdir -p ~/safe-gpt-next
cd ~/safe-gpt-next

# Create .env.production file
nano .env.production
```

Add your environment variables:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
NEXTAUTH_URL=http://your-ec2-ip:3000
NEXTAUTH_SECRET=your-secret-key-generate-using-openssl
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key
NODE_ENV=production
GITHUB_REPOSITORY=your-username/safe-gpt-next
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### Step 3: Login to GHCR on EC2

Create a GitHub Personal Access Token (PAT):
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with scopes: `read:packages`, `write:packages`
3. Copy the token

Login to GHCR on EC2:
```bash
echo 'YOUR_GITHUB_PAT' | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### Step 4: Download docker-compose.yml

```bash
cd ~/safe-gpt-next
curl -o docker-compose.yml https://raw.githubusercontent.com/YOUR_USERNAME/safe-gpt-next/master/docker-compose.prod.yml
```

Or create it manually using the [docker-compose.prod.yml](docker-compose.prod.yml) file.

### Step 5: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `EC2_HOST` | EC2 public IP or domain | `54.123.45.67` |
| `EC2_USERNAME` | EC2 SSH username | `ubuntu` |
| `EC2_SSH_KEY` | Private SSH key content | `-----BEGIN RSA PRIVATE KEY-----...` |
| `EC2_SSH_PORT` | SSH port (optional) | `22` |

To get your SSH key content:
```bash
cat ~/.ssh/your-key.pem
```

### Step 6: Configure EC2 Security Group

Add inbound rules:
- Type: SSH, Port: 22, Source: Your IP
- Type: Custom TCP, Port: 3000, Source: 0.0.0.0/0 (or your IP range)
- Type: HTTP, Port: 80, Source: 0.0.0.0/0 (if using reverse proxy)
- Type: HTTPS, Port: 443, Source: 0.0.0.0/0 (if using reverse proxy)

### Step 7: Test Deployment

Push to master/main branch:
```bash
git add .
git commit -m "Setup deployment"
git push origin master
```

Monitor deployment:
1. Go to GitHub → Actions tab
2. Watch the workflow run
3. Check for any errors

Verify on EC2:
```bash
# Check running containers
docker ps

# Check logs
docker logs safe-gpt-next -f

# Test the application
curl http://localhost:3000/api/health
```

## Workflow Explained

The [.github/workflows/deploy.yml](.github/workflows/deploy.yml) workflow:

1. **Build Job**:
   - Checks out code
   - Logs into GHCR
   - Builds Docker image
   - Pushes to GHCR with tags: `latest`, `master-<sha>`

2. **Deploy Job**:
   - SSHs into EC2
   - Pulls latest image from GHCR
   - Stops old container
   - Starts new container
   - Cleans up old images
   - Runs health check

## Manual Deployment

If you need to deploy manually:

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to deployment directory
cd ~/safe-gpt-next

# Login to GHCR (if not already logged in)
echo 'YOUR_PAT' | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Pull latest image
docker pull ghcr.io/your-username/safe-gpt-next:latest

# Stop and remove old container
docker-compose down

# Start new container
docker-compose up -d

# Check logs
docker logs safe-gpt-next -f
```

## Monitoring

### View Logs
```bash
# Real-time logs
docker logs safe-gpt-next -f

# Last 100 lines
docker logs safe-gpt-next --tail 100

# With docker-compose
docker-compose logs -f
```

### Check Container Status
```bash
docker ps
docker stats safe-gpt-next
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## Rollback

If deployment fails, rollback to previous version:

```bash
# Find previous image
docker images | grep safe-gpt-next

# Use specific tag
docker pull ghcr.io/your-username/safe-gpt-next:master-abc1234

# Update docker-compose.yml to use specific tag
# Then restart
docker-compose down
docker-compose up -d
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs safe-gpt-next

# Check environment variables
docker exec safe-gpt-next env

# Restart container
docker-compose restart
```

### GitHub Actions fails to SSH
- Verify EC2_SSH_KEY secret is correct (entire key including headers)
- Check EC2 security group allows SSH from GitHub Actions IPs
- Verify EC2_HOST is correct

### Cannot pull image from GHCR
- Verify GHCR login on EC2
- Check image name matches repository name
- Ensure package visibility is public or PAT has correct permissions

### Health check fails
- Ensure health endpoint is implemented: [app/api/health/route.ts](app/api/health/route.ts)
- Check if container is actually running: `docker ps`
- Verify port 3000 is exposed

## Production Enhancements

### 1. Use Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt-get install nginx -y

# Configure Nginx
sudo nano /etc/nginx/sites-available/safe-gpt-next
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/safe-gpt-next /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 2. Setup SSL with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 3. Setup Monitoring

Consider adding:
- CloudWatch for EC2 metrics
- Application logging (Winston, Pino)
- Error tracking (Sentry)
- Uptime monitoring (UptimeRobot)

## Cost Optimization

- Use EC2 Reserved Instances for long-term deployment
- Use Auto Scaling for traffic spikes
- Configure CloudWatch alarms
- Implement caching (Redis, CloudFront)

## Security Best Practices

1. Keep EC2 system updated: `sudo apt-get update && sudo apt-get upgrade`
2. Use IAM roles instead of SSH keys when possible
3. Enable EC2 Instance Connect
4. Rotate secrets regularly
5. Use AWS Secrets Manager for sensitive data
6. Enable VPC Flow Logs
7. Use Security Groups as firewalls
8. Implement rate limiting in application

## Support

For issues:
- Check GitHub Actions logs
- Check EC2 system logs: `journalctl -xe`
- Check Docker logs: `docker logs safe-gpt-next`
- Review [README.Docker.md](README.Docker.md) for Docker-specific issues
