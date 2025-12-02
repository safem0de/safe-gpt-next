# Docker Deployment Guide

## Prerequisites
- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)

## Quick Start

### 1. Build the Docker Image
```bash
docker build -t safe-gpt-next .
```

### 2. Run with Docker Compose
```bash
# Create production environment file
cp .env.production.example .env.production

# Edit .env.production with your actual values
# Then start the container
docker-compose up -d
```

### 3. Run with Docker directly
```bash
docker run -d \
  --name safe-gpt-next \
  -p 3000:3000 \
  --env-file .env.production \
  safe-gpt-next
```

## Docker Commands

### Build
```bash
# Build image
docker build -t safe-gpt-next .

# Build with specific platform (for M1/M2 Macs)
docker build --platform linux/amd64 -t safe-gpt-next .
```

### Run
```bash
# Run container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop container
docker-compose down

# Restart container
docker-compose restart
```

### Maintenance
```bash
# Check container status
docker ps

# Execute commands in container
docker exec -it safe-gpt-next sh

# View container logs
docker logs safe-gpt-next -f

# Remove container and image
docker-compose down
docker rmi safe-gpt-next
```

## Environment Variables

Create a `.env.production` file with the following variables:

```env
MONGODB_URI=mongodb://your-mongodb-uri
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret
OPENAI_API_KEY=your-api-key
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
```

## Production Deployment

### Deploy to Cloud Platforms

#### AWS ECS
```bash
# Build and push to ECR
aws ecr get-login-password --region region | docker login --username AWS --password-stdin account-id.dkr.ecr.region.amazonaws.com
docker tag safe-gpt-next:latest account-id.dkr.ecr.region.amazonaws.com/safe-gpt-next:latest
docker push account-id.dkr.ecr.region.amazonaws.com/safe-gpt-next:latest
```

#### Google Cloud Run
```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/project-id/safe-gpt-next
gcloud run deploy safe-gpt-next --image gcr.io/project-id/safe-gpt-next --platform managed
```

#### Docker Hub
```bash
docker tag safe-gpt-next your-dockerhub-username/safe-gpt-next:latest
docker push your-dockerhub-username/safe-gpt-next:latest
```

## Health Check

The application includes a health check endpoint. Add a health check API route at `/api/health`:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok' });
}
```

## Optimization Tips

1. **Multi-stage Build**: The Dockerfile uses multi-stage builds to minimize image size
2. **Layer Caching**: Dependencies are cached separately for faster builds
3. **Security**: Runs as non-root user (nextjs:nodejs)
4. **Standalone Output**: Uses Next.js standalone output for smaller image size

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs safe-gpt-next

# Check if port is already in use
lsof -i :3000
```

### Environment variables not loading
- Ensure `.env.production` exists
- Check Docker Compose env_file path
- Verify environment variables in container: `docker exec safe-gpt-next env`

### Build fails
- Clear Docker cache: `docker builder prune`
- Check Node version compatibility
- Ensure all dependencies are in package.json

## Image Size

Expected image size: ~150-200MB (with Alpine Linux base)

To check image size:
```bash
docker images safe-gpt-next
```

## Security Considerations

1. Never commit `.env.production` to version control
2. Use Docker secrets for sensitive data in production
3. Regularly update base images for security patches
4. Scan images for vulnerabilities: `docker scan safe-gpt-next`
5. Use specific version tags instead of `latest` in production
