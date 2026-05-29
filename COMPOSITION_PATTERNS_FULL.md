# Complete Web Application Stack - Full Implementation Guide

This document provides the complete, production-ready code for deploying a full web application stack with Infra Foundry.

## Project Structure

```
my-infrastructure/
├── Pulumi.yaml
├── Pulumi.production.yaml
├── Pulumi.development.yaml
├── index.ts                    # Main infrastructure code
├── config.ts                   # Configuration management
├── outputs.ts                  # Output management
└── types.ts                    # TypeScript interfaces
```

## Step 1: Initialize Pulumi Project

```bash
# Create new directory
mkdir my-infrastructure && cd my-infrastructure

# Initialize Pulumi project
pulumi new typescript

# Install dependencies
npm install infra-foundry @pulumi/aws @pulumi/awsx @pulumi/cloudflare

# Create stacks
pulumi stack init <org>/production
pulumi stack init <org>/development
```

## Step 2: Configuration Files

### types.ts

```typescript
export interface AppConfig {
  environment: string
  region: string
  vpcConfig: {
    cidrBlock: string
    azCount: number
  }
  ecsConfig: {
    desiredCount: number
    cpu: number
    memory: number
  }
  containerImage: string
  domain: string
  enableApexDomain: boolean
}
```

### config.ts

```typescript
import * as pulumi from '@pulumi/pulumi'
import { AppConfig } from './types'

export function getConfig(): AppConfig {
  const config = new pulumi.Config()
  const stack = pulumi.getStack()
  const isProduction = stack.includes('production')

  return {
    environment: stack,
    region: pulumi.getRegion() ?? 'us-east-1',
    vpcConfig: {
      cidrBlock: '10.0.0.0/16',
      azCount: 2,
    },
    ecsConfig: {
      desiredCount: isProduction ? 3 : 1,
      cpu: isProduction ? 512 : 256,
      memory: isProduction ? 1024 : 512,
    },
    containerImage: config.require('container_image'),
    domain: config.require('domain'),
    enableApexDomain: config.getBoolean('enable_apex_domain') ?? !isProduction,
  }
}
```

### outputs.ts

```typescript
import * as pulumi from '@pulumi/pulumi'
import * as infra from 'infra-foundry'

export interface ApplicationOutputs {
  infrastructure: {
    vpc: { id: pulumi.Output<string> }
    cluster: { arn: pulumi.Output<string>; name: pulumi.Output<string> }
  }
  endpoints: {
    api: pulumi.Output<string>
    www: pulumi.Output<string>
    cdn: pulumi.Output<string>
  }
  dns: {
    hostedZoneId: pulumi.Output<string>
    nameServers: pulumi.Output<string[]>
  }
  ecr: {
    repositoryUrl: pulumi.Output<string>
    repositoryName: pulumi.Output<string>
  }
  s3: {
    bucketName: pulumi.Output<string>
    bucketArn: pulumi.Output<string>
  }
}

export function createOutputs(
  vpc: infra.vpc.Vpc,
  cluster: infra.ecs.EcsCluster,
  apiService: infra.ecs.EcsService,
  webService: infra.ecs.EcsService,
  zone: infra.route53.HostedZone,
  ecrRepo: infra.ecr.EcrRepository,
  s3Bucket: infra.s3.S3Bucket
): ApplicationOutputs {
  return {
    infrastructure: {
      vpc: { id: vpc.vpc.vpc.id },
      cluster: {
        arn: cluster.cluster.arn,
        name: cluster.cluster.name,
      },
    },
    endpoints: {
      api: apiService.url,
      www: webService.url,
      cdn: s3Bucket.assetsCdn.domainName,
    },
    dns: {
      hostedZoneId: zone.zone.zoneId,
      nameServers: zone.zone.nameServers,
    },
    ecr: {
      repositoryUrl: ecrRepo.repository.repositoryUrl,
      repositoryName: ecrRepo.repository.name,
    },
    s3: {
      bucketName: s3Bucket.assetBucket.bucket,
      bucketArn: s3Bucket.assetBucket.arn,
    },
  }
}

export function exportOutputs(outputs: ApplicationOutputs): void {
  // Infrastructure
  pulumi.export('infrastructure.vpc.id', outputs.infrastructure.vpc.id)
  pulumi.export('infrastructure.cluster.arn', outputs.infrastructure.cluster.arn)

  // Endpoints
  pulumi.export('endpoints.api', outputs.endpoints.api)
  pulumi.export('endpoints.www', outputs.endpoints.www)
  pulumi.export('endpoints.cdn', outputs.endpoints.cdn)

  // DNS
  pulumi.export('dns.hostedZoneId', outputs.dns.hostedZoneId)
  pulumi.export('dns.nameServers', outputs.dns.nameServers)

  // ECR
  pulumi.export('ecr.repositoryUrl', outputs.ecr.repositoryUrl)
  pulumi.export('ecr.repositoryName', outputs.ecr.repositoryName)

  // S3
  pulumi.export('s3.bucketName', outputs.s3.bucketName)
  pulumi.export('s3.bucketArn', outputs.s3.bucketArn)
}
```

## Step 3: Main Infrastructure Code

### index.ts (Complete Implementation)

```typescript
import * as infra from 'infra-foundry'
import * as pulumi from '@pulumi/pulumi'
import { getConfig } from './config'
import { createOutputs, exportOutputs } from './outputs'

// Get configuration
const config = getConfig()

// Validate configuration
if (!config.containerImage) {
  throw new Error('container_image configuration is required')
}

if (!config.domain) {
  throw new Error('domain configuration is required')
}

// ============================================================
// 1. DNS SETUP
// ============================================================

const hostedZone = new infra.route53.HostedZone(
  `${config.environment}-zone`,
  {
    name: config.domain,
    comment: `Hosted zone for ${config.domain} (${config.environment})`,
  }
)

pulumi.log.info(`Created Route53 Zone for ${config.domain}`)

// ============================================================
// 2. NETWORK SETUP
// ============================================================

const vpc = new infra.vpc.Vpc(`app-${config.environment}`)

pulumi.log.info(`Created VPC with CIDR block ${config.vpcConfig.cidrBlock}`)

// ============================================================
// 3. CONTAINER REGISTRY
// ============================================================

const ecrRepo = new infra.ecr.EcrRepository({
  name: `app-${config.environment}`,
  maxImages: config.environment.includes('prod') ? 10 : 5,
})

pulumi.log.info(`Created ECR Repository for ${config.environment}`)

// ============================================================
// 4. ECS CLUSTER
// ============================================================

const cluster = new infra.ecs.EcsCluster(`app-${config.environment}`)

pulumi.log.info(`Created ECS Cluster for ${config.environment}`)

// ============================================================
// 5. API SERVICE
// ============================================================

const apiService = new infra.ecs.EcsService(
  `app-api-${config.environment}`,
  cluster,
  {
    image: config.containerImage,
    port: 3000,
    desiredCount: config.ecsConfig.desiredCount,
    cpu: config.ecsConfig.cpu,
    memory: config.ecsConfig.memory,
    environment: {
      NODE_ENV: config.environment,
      LOG_LEVEL: config.environment.includes('prod') ? 'warn' : 'debug',
      ENVIRONMENT: config.environment,
    },
    healthCheckConfig: {
      path: '/health',
      interval: 30,
      timeout: 5,
      healthyThreshold: 2,
      unhealthyThreshold: 3,
    },
    dnsConfig: {
      domainName: `api.${config.domain}`,
      zoneId: hostedZone.zone.zoneId,
      apexDomain: config.enableApexDomain ? config.domain : undefined,
    },
  },
  {
    vpc: vpc.vpc,
    vpcSecurityGroup: vpc.vpceSg,
  },
  {
    dependsOn: [vpc, cluster],
  }
)

pulumi.log.info(`Created API Service at api.${config.domain}`)

// ============================================================
// 6. WEB SERVICE (SPA HOSTING - OPTIONAL)
// ============================================================

const webService = new infra.ecs.EcsService(
  `app-web-${config.environment}`,
  cluster,
  {
    image: config.containerImage, // Could be different image
    port: 3001,
    desiredCount: config.ecsConfig.desiredCount,
    cpu: 256, // Web server can be lighter
    memory: 512,
    environment: {
      NODE_ENV: config.environment,
      API_URL: apiService.url,
    },
    healthCheckConfig: {
      path: '/',
      interval: 30,
      timeout: 5,
    },
    dnsConfig: {
      domainName: `www.${config.domain}`,
      zoneId: hostedZone.zone.zoneId,
    },
  },
  {
    vpc: vpc.vpc,
    vpcSecurityGroup: vpc.vpceSg,
  },
  {
    dependsOn: [vpc, cluster, apiService],
  }
)

pulumi.log.info(`Created Web Service at www.${config.domain}`)

// ============================================================
// 7. STATIC ASSETS
// ============================================================

const s3Bucket = new infra.s3.S3Bucket({
  name: `app-assets-${config.environment}`,
  contentExpiration: config.environment.includes('prod') ? 365 : 30,
})

pulumi.log.info(`Created S3 bucket for static assets`)

// ============================================================
// 8. OUTPUTS
// ============================================================

const outputs = createOutputs(
  vpc,
  cluster,
  apiService,
  webService,
  hostedZone,
  ecrRepo,
  s3Bucket
)

exportOutputs(outputs)

// Additional exports for CI/CD
export const apiUrl = apiService.url
export const ecrRepositoryUrl = ecrRepo.repository.repositoryUrl
export const bucketName = s3Bucket.assetBucket.bucket
export const hostedZoneId = hostedZone.zone.zoneId
```

## Step 4: Configuration Files

### Pulumi.yaml

```yaml
name: my-infrastructure
runtime: nodejs
description: Complete web application infrastructure

plugins:
  providers:
    - name: aws
      path: aws
    - name: awsx
      path: awsx
    - name: cloudflare
      path: cloudflare
```

### Pulumi.production.yaml

```yaml
config:
  aws:region: us-east-1
  container_image: "myregistry.dkr.ecr.us-east-1.amazonaws.com/myapp:v1.0.0"
  domain: "example.com"
  enable_apex_domain: true
  desired_count: 3
  instance_size: t3.large

secrets:
  encryptionsalt: <generated-by-pulumi>
```

### Pulumi.development.yaml

```yaml
config:
  aws:region: us-east-1
  container_image: "myregistry.dkr.ecr.us-east-1.amazonaws.com/myapp:latest"
  domain: "dev.example.com"
  enable_apex_domain: false

secrets:
  encryptionsalt: <generated-by-pulumi>
```

## Step 5: Deployment Guide

### Initial Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Select your stack
pulumi stack select production

# Set required configuration
pulumi config set container_image "myregistry.dkr.ecr.us-east-1.amazonaws.com/myapp:latest"
pulumi config set domain "example.com"
pulumi config set enable_apex_domain true
```

### Preview Changes

```bash
# See what will be created
pulumi preview

# Output shows:
# + aws:ec2:Vpc app-prod
# + aws:ecs:Cluster app-prod
# + aws:ecr:Repository app-prod
# + aws:ecs:Service api
# + aws:ecs:Service web
# + aws:s3:Bucket assets
# + aws:route53:Zone example.com
# ... (many more resources)
```

### Deploy Infrastructure

```bash
# Deploy with automatic confirmation
pulumi up --yes

# Or review changes before confirming
pulumi up
```

### Verify Deployment

```bash
# Get outputs
pulumi stack output

# Get specific output
pulumi stack output apiUrl
pulumi stack output ecrRepositoryUrl
pulumi stack output bucketName

# Check Route53 nameservers
pulumi stack output 'dns.nameServers'
```

### Update Domain Registrar

```bash
# Get nameservers
NAMESERVERS=$(pulumi stack output 'dns.nameServers')

# Update your domain registrar to use these nameservers
# (This varies by registrar - example for Route53 delegation)
```

## Step 6: Application Deployment

### Build and Push Docker Image

```bash
# Build image locally
docker build -t myapp:v1.0.0 .

# Tag with ECR URL
ECR_URL=$(pulumi stack output 'ecr.repositoryUrl')
docker tag myapp:v1.0.0 ${ECR_URL}:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ${ECR_URL}

# Push image
docker push ${ECR_URL}:latest

# ECS automatically pulls the new image
```

### Deploy Frontend Assets

```bash
# Build frontend
npm run build

# Get bucket name
BUCKET=$(pulumi stack output 's3.bucketName')

# Sync to S3 (CloudFront will serve from there)
aws s3 sync ./dist s3://${BUCKET}/ --delete

# Cache busting for specific files
aws s3 sync ./dist s3://${BUCKET}/ \
  --delete \
  --cache-control "max-age=31536000" \
  --exclude "index.html"

aws s3 cp ./dist/index.html s3://${BUCKET}/index.html \
  --cache-control "no-cache, must-revalidate"
```

## Step 7: Post-Deployment Verification

### Test Endpoints

```bash
# Get API URL
API_URL=$(pulumi stack output 'endpoints.api')

# Test health endpoint
curl ${API_URL}/health

# Test API
curl ${API_URL}/api/data
```

### Check CloudFront

```bash
# Get CDN URL
CDN_URL=$(pulumi stack output 'endpoints.cdn')

# Test asset serving
curl https://${CDN_URL}/index.html
```

### Monitor Services

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster app-prod \
  --services app-api-prod app-web-prod

# View logs
aws logs tail /aws/ecs/app-prod --follow

# Check Route53 records
aws route53 list-resource-record-sets \
  --hosted-zone-id $(pulumi stack output 'dns.hostedZoneId')
```

## Step 8: Cleanup (Destroy Infrastructure)

```bash
# Preview what will be deleted
pulumi destroy --skip-confirmations false

# Destroy with automatic confirmation
pulumi destroy --yes

# Remove stack
pulumi stack rm production
```

## Troubleshooting

### Common Issues

**Issue: Container fails to start**
```bash
# Check container logs
aws logs tail /aws/ecs/app-prod --follow

# Verify image exists in ECR
aws ecr describe-images --repository-name app-prod
```

**Issue: DNS not resolving**
```bash
# Verify nameservers are set correctly at registrar
nslookup example.com

# Check Route53 records
aws route53 list-resource-record-sets \
  --hosted-zone-id $(pulumi stack output 'dns.hostedZoneId')
```

**Issue: S3 bucket not accessible**
```bash
# Check CloudFront distribution
aws cloudfront get-distribution \
  --id $(pulumi stack output 'cdn.distributionId')

# Verify bucket policy
aws s3api get-bucket-policy \
  --bucket $(pulumi stack output 's3.bucketName')
```

## Security Best Practices

1. **Secrets Management**
   ```bash
   # Never commit secrets to git
   pulumi config set --secret db_password "..."
   ```

2. **IAM Policies**
   - ECS task roles have minimal permissions
   - S3 bucket accessed only through CloudFront
   - ECR accessible only from ECS

3. **Network Security**
   - VPC endpoints for private AWS service access
   - Security groups restrict traffic
   - ALB uses HTTPS

4. **Monitoring**
   - CloudWatch logs for all services
   - CloudWatch alarms for errors
   - Health checks ensure service availability

## Scaling the Infrastructure

### Increase Service Capacity

```bash
# Update desired count for more instances
pulumi config set desired_count 5

# Deploy changes
pulumi up
```

### Add New Services

Duplicate the service creation pattern in `index.ts`:

```typescript
const newService = new infra.ecs.EcsService(
  'new-service',
  cluster,
  { /* configuration */ },
  { vpc: vpc.vpc, vpcSecurityGroup: vpc.vpceSg }
)
```

### Multi-Region Deployment

See `COMPOSITION_PATTERNS.md` for multi-region setup guide.

