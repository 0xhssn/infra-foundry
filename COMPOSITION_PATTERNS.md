# 🏗️ Component Composition Patterns

This guide demonstrates how to compose Infra Foundry components to build complete, production-ready infrastructure architectures. Each pattern shows how multiple components work together to solve common infrastructure challenges.

## Table of Contents

1. [VPC + ECS Pattern](#vpc--ecs-pattern)
2. [S3 + CloudFront Pattern](#s3--cloudfront-pattern)
3. [Complete Web Application Stack](#complete-web-application-stack)
4. [Microservices Architecture](#microservices-architecture)
5. [Multi-Region Setup](#multi-region-setup)
6. [DNS & Domain Management](#dns--domain-management)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)

---

## VPC + ECS Pattern

### Overview

This pattern creates an isolated network environment (VPC) and deploys a containerized application (ECS) within it. The VPC includes secure networking with VPC endpoints for private communication with AWS services.

### Architecture

```
┌─────────────────────────────────┐
│        VPC (10.0.0.0/16)        │
│  ┌───────────────────────────┐  │
│  │   ECS Fargate Service    │  │
│  │  (Container Running)      │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  VPC Endpoints:           │  │
│  │  - ECR API & DKR          │  │
│  │  - CloudWatch Logs        │  │
│  │  - S3                     │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Implementation

```typescript
import * as infra from 'infra-foundry'

// Create VPC with VPC Endpoints for private service access
const vpc = new infra.vpc.Vpc('myapp')

// Create ECS Cluster
const cluster = new infra.ecs.EcsCluster('myapp')

// Deploy containerized application to ECS
const ecsService = new infra.ecs.EcsService(
  'myapp-api',
  cluster,
  {
    image: 'myregistry.dkr.ecr.us-east-1.amazonaws.com/myapp:latest',
    port: 3000,
    desiredCount: 2,
    cpu: 512,
    memory: 1024,
    environment: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
    },
    dnsConfig: {
      domainName: 'api.example.com',
      zoneId: route53Zone.zone.zoneId,
    },
  },
  {
    vpc: vpc.vpc,
    vpcSecurityGroup: vpc.vpceSg,
  }
)

// Export service URL
export const serviceUrl = ecsService.url
```

### Key Benefits

- **Isolated Network**: VPC provides network isolation
- **Private Service Access**: VPC endpoints enable private communication with AWS services without internet gateway
- **Auto-Scaling Ready**: ECS Fargate handles container orchestration
- **Health Checks**: Built-in health checks and load balancing
- **DNS Integration**: Automatic Route53 record creation

### Configuration Options

| Component | Key Options |
|-----------|------------|
| VPC | CIDR block, availability zones, VPC endpoints |
| ECS Service | Image, port, CPU/memory, desired count, environment variables |
| Load Balancer | Health check path, interval, timeout |
| DNS | Domain name, hosted zone ID, SSL certificate validation |

---

## S3 + CloudFront Pattern

### Overview

This pattern sets up secure, scalable static asset delivery using S3 for storage and CloudFront for CDN caching and distribution.

### Architecture

```
┌──────────────────────────────────────┐
│    CloudFront Distribution           │
│  ┌────────────────────────────────┐  │
│  │  Global Edge Locations         │  │
│  │  (Caching Layer)               │  │
│  └────────────────────────────────┘  │
│              ↓                        │
│  ┌────────────────────────────────┐  │
│  │  Origin Access Identity (OAI)  │  │
│  └────────────────────────────────┘  │
│              ↓                        │
│  ┌────────────────────────────────┐  │
│  │  S3 Bucket                      │  │
│  │  (Private - OAI Access Only)    │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Implementation

```typescript
import * as infra from 'infra-foundry'

// Create S3 bucket with CloudFront CDN
const assetStorage = new infra.s3.S3Bucket(
  {
    name: 'myapp-assets',
    contentExpiration: 90, // Expire objects after 90 days
  }
)

// Export CloudFront distribution URL
export const cdnUrl = assetStorage.assetsCdn.domainName
export const bucketUrl = assetStorage.assetBucket.bucketRegionalDomainName

// Use in application
export const assetUrls = {
  cdn: `https://${assetStorage.assetsCdn.domainName}`,
  bucket: `https://${assetStorage.assetBucket.bucketRegionalDomainName}`,
}
```

### What the Component Provides

1. **S3 Bucket** with:
   - Private ACL (no public access)
   - CORS enabled for cross-origin requests
   - Versioning for rollback capability
   - Server-side encryption (AES256)
   - Automatic lifecycle management

2. **CloudFront Distribution** with:
   - Origin Access Identity for private bucket access
   - Caching optimized for static assets
   - HTTP to HTTPS redirect
   - IPv6 support

3. **Bucket Policy** that:
   - Restricts access to CloudFront only
   - Prevents direct S3 access

### Configuration Options

| Option | Purpose | Example |
|--------|---------|---------|
| `name` | Resource identifier | `myapp-assets` |
| `contentExpiration` | Auto-delete old objects (days) | `90` |
| CloudFront TTL | Cache duration | 1 day (default), 1 year (max) |

### Usage in Web Application

```typescript
// In your application code
const imageUrl = `https://${cdnUrl}/images/logo.png`
const cssUrl = `https://${cdnUrl}/styles/main.css`

// CloudFront caches these at edge locations worldwide
// Requests automatically redirect to HTTPS
// Only CloudFront can access the S3 bucket directly
```

---

## Complete Web Application Stack

### Overview

This pattern demonstrates a complete, production-grade infrastructure for hosting a modern web application with separate frontend (static) and backend (containerized) components.

### Architecture

```
                    ┌─────────────────────────┐
                    │   Route53 (DNS)         │
                    │ - example.com           │
                    │ - api.example.com       │
                    │ - www.example.com       │
                    └────┬────────────────┬───┘
                         │                │
         ┌───────────────┘                └──────────────┐
         │                                               │
    ┌────▼──────────────┐                     ┌─────────▼────┐
    │   CloudFront      │                     │  ALB + ECS   │
    │   Distribution    │                     │  (API Server)│
    ├──────────────────┤                     ├──────────────┤
    │ Static Assets    │                     │  Container   │
    │ - HTML           │                     │  - Node.js   │
    │ - CSS            │                     │  - Port 3000 │
    │ - JS             │                     │              │
    └────┬─────────────┘                     └──────┬───────┘
         │                                          │
         │                      ┌──────────────────┘
         │                      │
    ┌────▼──────────────┐  ┌───▼─────────────┐
    │   S3 Bucket       │  │   VPC           │
    │   (Private)       │  │ (10.0.0.0/16)  │
    └───────────────────┘  └─────────────────┘
```

### Implementation

See `COMPOSITION_PATTERNS_FULL.md` for the complete web application stack implementation with all deployment steps and configuration options.

---

## Microservices Architecture

### Overview

Deploy multiple independent services with their own isolated networks while maintaining centralized DNS and monitoring.

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│                  Route53 (DNS Routing)                     │
│  api.example.com → ALB-API                                │
│  auth.example.com → ALB-Auth                              │
│  workers.example.com → ALB-Workers                        │
└────────────────┬───────────────────────────────────────────┘
                 │
        ┌────────┴─────────┬──────────────┐
        │                  │              │
   ┌────▼────┐      ┌─────▼────┐    ┌───▼─────┐
   │ API      │      │ Auth     │    │ Workers │
   │ Service  │      │ Service  │    │ Service │
   │ ECS      │      │ ECS      │    │ ECS     │
   └────┬─────┘      └────┬─────┘    └───┬─────┘
        │                 │              │
   ┌────▼─────────────────▼──────────────▼─────┐
   │           Shared VPC (10.0.0.0/16)        │
   │  ┌──────────────────────────────────────┐ │
   │  │  VPC Endpoints:                      │ │
   │  │  - ECR (image pulling)               │ │
   │  │  - Secrets Manager (credentials)     │ │
   │  │  - Logs (centralized logging)        │ │
   │  │  - S3 (data/backups)                 │ │
   │  └──────────────────────────────────────┘ │
   └────────────────────────────────────────────┘
```

### Quick Example

```typescript
import * as infra from 'infra-foundry'
import * as pulumi from '@pulumi/pulumi'

const hostedZone = new infra.route53.HostedZone('myplatform-zone', {
  name: 'platform.io',
})

const vpc = new infra.vpc.Vpc('myplatform')
const ecsCluster = new infra.ecs.EcsCluster('myplatform')

const services = ['api', 'auth', 'workers']

export const serviceUrls: Record<string, pulumi.Output<string>> = {}

for (const service of services) {
  const ecrRepo = new infra.ecr.EcrRepository({
    name: `myplatform-${service}`,
    maxImages: 5,
  })

  const ecsService = new infra.ecs.EcsService(
    service,
    ecsCluster,
    {
      image: ecrRepo.repository.repositoryUrl.apply((url) => `${url}:latest`),
      port: 3000 + services.indexOf(service),
      desiredCount: 2,
      environment: { SERVICE_NAME: service },
      dnsConfig: {
        domainName: `${service}.platform.io`,
        zoneId: hostedZone.zone.zoneId,
      },
    },
    { vpc: vpc.vpc, vpcSecurityGroup: vpc.vpceSg }
  )

  serviceUrls[service] = ecsService.url
}
```

### Key Characteristics

- **Independent Scaling**: Each service scales independently
- **Fault Isolation**: Service failures don't affect others
- **Shared Infrastructure**: VPC, cluster, and DNS are shared for cost efficiency
- **Centralized Logging**: All services log to CloudWatch through VPC endpoint
- **Service Discovery**: Route53 provides DNS-based service discovery

---

## Multi-Region Setup

### Overview

Deploy your infrastructure across multiple AWS regions for high availability and disaster recovery.

### Pattern

```typescript
import * as infra from 'infra-foundry'
import * as pulumi from '@pulumi/pulumi'

const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1']

interface RegionalStack {
  vpc: infra.vpc.Vpc
  cluster: infra.ecs.EcsCluster
  service: infra.ecs.EcsService
  s3: infra.s3.S3Bucket
}

const stacks: Record<string, RegionalStack> = {}

// Create DNS zone once (in primary region)
const hostedZone = new infra.route53.HostedZone('global-zone', {
  name: 'example.com',
})

// Create regional stacks
for (const region of regions) {
  const vpc = new infra.vpc.Vpc(`myapp-${region}`)
  const cluster = new infra.ecs.EcsCluster(`myapp-${region}`)
  
  const ecrRepo = new infra.ecr.EcrRepository({
    name: `myapp-${region}`,
    maxImages: 3,
  })

  const service = new infra.ecs.EcsService(
    `myapp-${region}`,
    cluster,
    {
      image: `myapp:latest`,
      port: 3000,
      desiredCount: 2,
      dnsConfig: {
        domainName: `${region}.api.example.com`,
        zoneId: hostedZone.zone.zoneId,
      },
    },
    { vpc: vpc.vpc, vpcSecurityGroup: vpc.vpceSg }
  )

  const assets = new infra.s3.S3Bucket({
    name: `myapp-assets-${region}`,
  })

  stacks[region] = { vpc, cluster, service, s3: assets }
}

export const regionalEndpoints = Object.entries(stacks).map(([region, stack]) => ({
  region,
  apiUrl: stack.service.url,
  cdnUrl: stack.s3.assetsCdn.domainName,
}))
```

### Considerations

- **Data Replication**: Coordinate data sync across regions
- **Cost**: Multi-region increases infrastructure costs
- **Complexity**: Manage configuration across regions
- **Compliance**: Ensure data residency requirements are met

---

## DNS & Domain Management

### Pattern 1: AWS Route53 Only

```typescript
import * as infra from 'infra-foundry'

// Create hosted zone
const zone = new infra.route53.HostedZone('company-zone', {
  name: 'company.com',
  comment: 'Primary DNS zone for company.com',
})

// Export nameservers for domain registrar
export const nameServers = zone.zone.nameServers
```

### Pattern 2: Cloudflare + Route53 Hybrid

This pattern uses Cloudflare as the primary DNS but delegates subdomains to AWS Route53.

```typescript
import * as infra from 'infra-foundry'

// Create Route53 zone for AWS services
const awsZone = new infra.route53.HostedZone('aws-services', {
  name: 'api.example.com',
})

// Get Route53 nameservers
const route53Nameservers = awsZone.zone.nameServers

// Create Cloudflare nameserver records to delegate to Route53
const cloudflareNsRecords = new infra.cloudflare.CloudflareNameserver(
  'api-delegation',
  {
    domain: 'api.example.com',
    nameServers: route53Nameservers,
    zoneId: 'your-cloudflare-zone-id', // Optional: specify if zone exists
  }
)

export const outputs = {
  route53Zone: awsZone.zone.zoneId,
  cloudflareRecords: cloudflareNsRecords.nameserverRecords,
}
```

### Pattern 3: Multiple Subdomains

```typescript
import * as infra from 'infra-foundry'

const zone = new infra.route53.HostedZone('main-zone', {
  name: 'example.com',
})

// Each service gets its own subdomain
const apiService = new infra.ecs.EcsService(
  'api',
  cluster,
  {
    image: 'api:latest',
    port: 3000,
    dnsConfig: {
      domainName: 'api.example.com',
      zoneId: zone.zone.zoneId,
    },
  },
  { vpc: vpc.vpc, vpcSecurityGroup: vpc.vpceSg }
)

const webService = new infra.ecs.EcsService(
  'web',
  cluster,
  {
    image: 'web:latest',
    port: 3001,
    dnsConfig: {
      domainName: 'www.example.com',
      zoneId: zone.zone.zoneId,
    },
  },
  { vpc: vpc.vpc, vpcSecurityGroup: vpc.vpceSg }
)

export const endpoints = {
  api: apiService.url,
  web: webService.url,
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Deploy Infrastructure and Application

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1

jobs:
  deploy-infra:
    runs-on: ubuntu-latest
    outputs:
      api-url: ${{ steps.pulumi.outputs.api_url }}
      ecr-url: ${{ steps.pulumi.outputs.ecr_url }}

    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Pulumi
        uses: pulumi/actions@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Deploy Infrastructure
        id: pulumi
        run: |
          pulumi config set database_url ${{ secrets.DATABASE_URL }}
          pulumi up --yes --stack production
          echo "api_url=$(pulumi stack output apiUrl)" >> $GITHUB_OUTPUT
          echo "ecr_url=$(pulumi stack output ecrRepositoryUrl)" >> $GITHUB_OUTPUT

  deploy-app:
    needs: deploy-infra
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Build and Push Docker Image
        run: |
          docker build -t myapp:${{ github.sha }} .
          docker tag myapp:${{ github.sha }} ${{ needs.deploy-infra.outputs.ecr-url }}:latest
          aws ecr get-login-password | docker login --username AWS --password-stdin ${{ needs.deploy-infra.outputs.ecr-url }}
          docker push ${{ needs.deploy-infra.outputs.ecr-url }}:latest

      - name: Deploy Frontend Assets
        run: |
          npm run build
          aws s3 sync ./dist s3://$(pulumi stack output bucketName)/ --delete
```

### Deployment Process

1. **Infrastructure Update**: Pulumi deploys/updates AWS resources
2. **Output Stack Values**: Infrastructure exports ECR URL, bucket names, etc.
3. **Build & Push**: Application code is built and pushed to ECR
4. **Deploy Assets**: Static assets synced to S3
5. **Automatic Service Update**: ECS pulls new image from ECR automatically

---

## Best Practices

### 1. Configuration Management

```typescript
import * as pulumi from '@pulumi/pulumi'

export interface EnvironmentConfig {
  environment: string
  region: string
  desiredCount: number
  containerImage: string
}

export function getConfig(): EnvironmentConfig {
  const config = new pulumi.Config()
  const stack = pulumi.getStack()

  return {
    environment: stack,
    region: pulumi.getRegion() ?? 'us-east-1',
    desiredCount: config.getNumber('desired_count') ?? (stack === 'prod' ? 3 : 1),
    containerImage: config.require('container_image'),
  }
}
```

### 2. Organized Output Management

```typescript
export const infrastructure = {
  vpc: { id: vpc.vpc.vpc.id },
  cluster: { arn: cluster.cluster.arn },
}

export const endpoints = {
  api: apiService.url,
  cdn: staticAssets.assetsCdn.domainName,
}

export const images = {
  ecrUrl: ecrRepo.repository.repositoryUrl,
}
```

### 3. Environment-Specific Configurations

```yaml
# Pulumi.production.yaml
config:
  aws:region: us-east-1
  desired_count: 3

# Pulumi.development.yaml
config:
  aws:region: us-east-1
  desired_count: 1
```

### 4. Secrets Management

```typescript
const config = new pulumi.Config()

// Never hardcode secrets
const dbPassword = config.requireSecret('db_password')
const apiKey = config.requireSecret('api_key')

// Set via CLI:
// pulumi config set --secret db_password "mypassword"
```

### 5. Dependency Management

```typescript
const vpc = new infra.vpc.Vpc('myapp')
const cluster = new infra.ecs.EcsCluster('myapp')

const ecsService = new infra.ecs.EcsService(
  'api',
  cluster,
  { /* config */ },
  { vpc: vpc.vpc, vpcSecurityGroup: vpc.vpceSg },
  { dependsOn: [vpc] } // Explicit dependency
)
```

### 6. Stack Naming Convention

```
<organization>/<project>/<environment>

Examples:
- myorg/production
- myorg/staging
- myorg/development
```

---

## Next Steps

1. **Choose a Pattern**: Select the pattern that best matches your infrastructure needs
2. **Set Up Pulumi**: Initialize a Pulumi project and stack
3. **Configure**: Set required configuration values and secrets
4. **Preview**: Run `pulumi preview` to see what will be created
5. **Deploy**: Run `pulumi up` to deploy your infrastructure
6. **Monitor**: Use Pulumi console to track your resources

For more detailed examples, see the supplementary guides:
- `COMPOSITION_PATTERNS_FULL.md` - Complete web application stack with full code
- `TROUBLESHOOTING.md` - Common issues and solutions

