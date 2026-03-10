# Example: Containerized Application

This example demonstrates deploying a containerized Node.js API using ECS Fargate.

## Overview

We'll create:

- VPC with private networking
- ECR repository for Docker images
- ECS Fargate cluster and service
- Application Load Balancer
- Route53 DNS records
- Secrets Manager for configuration

## Prerequisites

- Pulumi CLI installed
- AWS credentials configured
- Docker installed
- A registered domain in Route53

## Project Structure

```
my-api/
├── index.ts          # Pulumi infrastructure code
├── package.json
├── Pulumi.yaml
└── app/
    ├── Dockerfile
    ├── package.json
    └── src/
        └── index.js
```

## Step 1: Create the Application

Create `app/src/index.js`:

```javascript
const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from ECS Fargate!',
    environment: process.env.NODE_ENV,
    secret: process.env.API_KEY ? 'Secret loaded' : 'No secret',
  })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`)
})
```

Create `app/package.json`:

```json
{
  "name": "my-api",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

Create `app/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

EXPOSE 3000

CMD ["npm", "start"]
```

## Step 2: Create Infrastructure Code

Edit `index.ts`:

```typescript
import * as pulumi from '@pulumi/pulumi'
import { vpc, ecr, image, ecs, route53, secret } from 'infra-foundry'

const config = new pulumi.Config()
const domain = config.require('domain')

// Create VPC
const network = new vpc.Vpc('my-api')

// Create hosted zone
const zone = route53.createHostedZone({
  name: domain,
  findExisting: true,
})

// Create ECR repository
const repo = new ecr.EcrRepository({
  name: 'my-api',
  maxImages: 10,
})

// Build and push Docker image
const appImage = new image.Image({
  imageName: 'my-api',
  repositoryUrl: repo.repository.repositoryUrl,
  context: './app',
  dockerfile: './app/Dockerfile',
})

// Create secrets
const appSecrets = new secret.Secret({
  name: 'my-api-secrets',
  secrets: {
    API_KEY: config.requireSecret('apiKey'),
    DATABASE_URL: config.requireSecret('databaseUrl'),
  },
})

// Create ECS cluster
const cluster = new ecs.EcsCluster({
  name: 'my-api-cluster',
})

// Create ECS service
const service = new ecs.EcsService({
  name: 'my-api',
  image: appImage.imageUri,
  port: 3000,
  cpu: 256,
  memory: 512,
  desiredCount: 2,
  environment: {
    NODE_ENV: 'production',
    PORT: '3000',
  },
  secretName: appSecrets.secret.name,
  dnsConfig: {
    domainName: `api.${domain}`,
    zoneId: zone.apply((z) => z.zone.zoneId),
  },
  healthCheckConfig: {
    path: '/health',
    interval: 30,
    timeout: 5,
  },
})

// Export outputs
export const apiUrl = pulumi.interpolate`https://api.${domain}`
export const loadBalancerUrl = service.loadBalancer.dnsName
export const repositoryUrl = repo.repository.repositoryUrl
export const imageUri = appImage.imageUri
```

## Step 3: Configure Pulumi

```bash
# Set configuration
pulumi config set domain example.com
pulumi config set --secret apiKey your-secret-api-key
pulumi config set --secret databaseUrl postgresql://user:pass@host/db
pulumi config set aws:region us-east-1
```

## Step 4: Deploy

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# This will:
# 1. Create VPC and networking
# 2. Create ECR repository
# 3. Build Docker image
# 4. Push image to ECR
# 5. Create ECS cluster and service
# 6. Create load balancer
# 7. Create DNS records
```

## Step 5: Test the API

```bash
# Get the API URL
API_URL=$(pulumi stack output apiUrl)

# Test health endpoint
curl $API_URL/health

# Test API endpoint
curl $API_URL/api/hello
```

## Updating the Application

To deploy a new version:

1. Modify your application code
2. Run `pulumi up`
3. Pulumi will rebuild the image and update the ECS service

```bash
# Make changes to app/src/index.js
# Then deploy
pulumi up
```

## Scaling

To scale the service:

```typescript
const service = new ecs.EcsService({
  // ... other config
  desiredCount: 5, // Increase from 2 to 5
  cpu: 512, // Increase CPU
  memory: 1024, // Increase memory
})
```

## Monitoring

View logs in CloudWatch:

```bash
aws logs tail /ecs/my-api --follow
```

View ECS service status:

```bash
aws ecs describe-services \
  --cluster my-api-cluster \
  --services my-api
```

## Cleanup

```bash
pulumi destroy
```

## Next Steps

- Add a database (RDS)
- Implement auto-scaling
- Add CloudWatch alarms
- Set up CI/CD pipeline
- Add caching with ElastiCache

## Cost Estimate

- VPC: Free
- ECS Fargate: ~$15/month per task (2 tasks = $30)
- Load Balancer: ~$16/month
- ECR: ~$0.10/GB/month
- Total: ~$50-60/month
