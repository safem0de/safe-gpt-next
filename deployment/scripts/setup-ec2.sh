#!/bin/bash

# EC2 Setup Script for Safe GPT Next
# This script prepares an EC2 instance for deployment

set -e

echo "🚀 Setting up EC2 instance for Safe GPT Next..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
echo "🐙 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose already installed"
fi

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p ~/safe-gpt-next
cd ~/safe-gpt-next

# Create .env.production file
echo "📝 Creating environment file..."
if [ ! -f .env.production ]; then
    cat > .env.production << 'EOF'
# Production Environment Variables
# Update these values with your actual credentials

MONGODB_URI=mongodb://your-mongodb-uri
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=your-openai-api-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key
NODE_ENV=production
GITHUB_REPOSITORY=your-username/safe-gpt-next
EOF
    echo "⚠️  Please edit .env.production with your actual values"
    echo "Run: nano ~/safe-gpt-next/.env.production"
else
    echo "✅ .env.production already exists"
fi

# Download docker-compose.yml from repository
echo "📥 Downloading docker-compose configuration..."
if [ ! -f docker-compose.yml ]; then
    # You need to replace this URL with your actual repository
    curl -o docker-compose.yml https://raw.githubusercontent.com/YOUR_USERNAME/safe-gpt-next/master/docker-compose.prod.yml || \
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    image: ghcr.io/${GITHUB_REPOSITORY}:latest
    container_name: safe-gpt-next
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  app-network:
    driver: bridge
EOF
fi

# Create health check API route info
echo "📋 Creating health check endpoint..."
cat > HEALTH_CHECK_SETUP.md << 'EOF'
# Health Check Setup

You need to create a health check API endpoint in your Next.js app:

Create the file: `app/api/health/route.ts`

```typescript
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
```

This endpoint is used by:
1. Docker healthcheck
2. GitHub Actions deployment verification
3. Load balancer health checks (if applicable)
EOF

echo ""
echo "✅ EC2 setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Edit environment variables:"
echo "   nano ~/safe-gpt-next/.env.production"
echo ""
echo "2. Add GitHub Personal Access Token (PAT) for GHCR:"
echo "   echo 'YOUR_GITHUB_PAT' | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin"
echo ""
echo "3. The deployment directory is ready at: ~/safe-gpt-next"
echo ""
echo "4. GitHub Actions will automatically deploy when you push to master/main"
echo ""
echo "⚠️  Don't forget to:"
echo "   - Add health check endpoint to your Next.js app (see HEALTH_CHECK_SETUP.md)"
echo "   - Configure GitHub Secrets in your repository"
echo "   - Open port 3000 in EC2 Security Group"
echo ""
