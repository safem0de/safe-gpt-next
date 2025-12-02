#!/bin/bash

# Local Deployment Script for Safe GPT Next
# This script deploys the Docker image to localhost

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="safe-gpt-next"
PORT="3000"
IMAGE_NAME="${GITHUB_REPOSITORY:-ghcr.io/YOUR_USERNAME/safe-gpt-next}"
ENV_FILE=".env.production"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 Safe GPT Next - Local Deployment                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo -e "${YELLOW}Please install Docker: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  $ENV_FILE not found!${NC}"
    echo -e "${YELLOW}Creating template file...${NC}"
    cat > "$ENV_FILE" << 'EOF'
# Production Environment Variables
MONGODB_URI=mongodb://localhost:27017/safe-gpt
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-this-to-random-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key
NODE_ENV=production
EOF
    echo -e "${YELLOW}📝 Please edit $ENV_FILE with your actual values${NC}"
    echo -e "${YELLOW}Then run this script again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment file found${NC}"

# Check if user is logged in to GHCR
echo ""
echo -e "${BLUE}🔐 Checking GHCR authentication...${NC}"
if ! docker info 2>/dev/null | grep -q "ghcr.io"; then
    echo -e "${YELLOW}⚠️  Not logged in to GitHub Container Registry${NC}"
    echo -e "${YELLOW}Please login first:${NC}"
    echo -e "${YELLOW}  echo 'YOUR_GITHUB_PAT' | docker login ghcr.io -u YOUR_USERNAME --password-stdin${NC}"

    read -p "Do you want to login now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "GitHub Username: " GITHUB_USER
        read -sp "GitHub Personal Access Token: " GITHUB_PAT
        echo
        echo "$GITHUB_PAT" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin
    else
        echo -e "${RED}❌ Cannot proceed without GHCR authentication${NC}"
        exit 1
    fi
fi

# Pull latest image
echo ""
echo -e "${BLUE}📥 Pulling latest image from GHCR...${NC}"
echo -e "${YELLOW}Image: $IMAGE_NAME:latest${NC}"
if docker pull "$IMAGE_NAME:latest"; then
    echo -e "${GREEN}✅ Image pulled successfully${NC}"
else
    echo -e "${RED}❌ Failed to pull image${NC}"
    echo -e "${YELLOW}Make sure the image exists in GHCR and you have access${NC}"
    exit 1
fi

# Stop and remove old container
echo ""
echo -e "${BLUE}🛑 Stopping old container...${NC}"
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    echo -e "${GREEN}✅ Old container removed${NC}"
else
    echo -e "${YELLOW}ℹ️  No existing container found${NC}"
fi

# Start new container
echo ""
echo -e "${BLUE}▶️  Starting new container...${NC}"
docker run -d \
    --name "$CONTAINER_NAME" \
    -p "$PORT:3000" \
    --env-file "$ENV_FILE" \
    --restart unless-stopped \
    "$IMAGE_NAME:latest"

# Wait for container to be ready
echo ""
echo -e "${BLUE}⏳ Waiting for container to be ready...${NC}"
sleep 5

# Check container status
if docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${GREEN}✅ Container is running!${NC}"
    echo ""
    docker ps | grep "$CONTAINER_NAME"

    # Try to access health endpoint
    echo ""
    echo -e "${BLUE}🏥 Checking health endpoint...${NC}"
    sleep 5
    if curl -sf "http://localhost:$PORT/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check failed, but container is running${NC}"
        echo -e "${YELLOW}Check logs: docker logs $CONTAINER_NAME${NC}"
    fi
else
    echo -e "${RED}❌ Container failed to start!${NC}"
    echo -e "${RED}Logs:${NC}"
    docker logs "$CONTAINER_NAME"
    exit 1
fi

# Clean up old images
echo ""
echo -e "${BLUE}🧹 Cleaning up old images...${NC}"
docker image prune -af > /dev/null 2>&1
echo -e "${GREEN}✅ Cleanup completed${NC}"

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Deployment Completed Successfully!                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 Application is running at:${NC} ${GREEN}http://localhost:$PORT${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  View logs:     ${BLUE}docker logs $CONTAINER_NAME -f${NC}"
echo -e "  Stop:          ${BLUE}docker stop $CONTAINER_NAME${NC}"
echo -e "  Restart:       ${BLUE}docker restart $CONTAINER_NAME${NC}"
echo -e "  Remove:        ${BLUE}docker rm -f $CONTAINER_NAME${NC}"
echo ""
