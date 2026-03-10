# ECS Component

The ECS component provides AWS ECS Fargate container orchestration with automatic load balancing, DNS configuration, and IAM role management.

## Features

- ECS Fargate cluster management
- Application Load Balancer with health checks
- Automatic DNS record creation (Route53)
- IAM roles with least-privilege access
- Environment variables and secrets support
- Auto-scaling capabilities
- HTTPS support with ACM certificates
- Integration with S3, SES, and Secrets Manager

## Usage

### Basic Example

```typescript
import { ecs, vpc } from 'infra-foundry'
import * as pulumi from '@pulumi/pulumi'

// Create VPC first
const network = new vpc.Vpc('my-vpc')

// Create ECS cluster
const cluster = new ecs.EcsCluster({
  name: 'my-cluster',
})

// Create ECS service
const service = new ecs.EcsService({
  name: 'my-api',
  image: 'nginx:latest',
  port: 80,
  dnsConfig: {
    domainName: 'api.example.com',
    zoneId: hostedZone.zoneId,
  },
  healthCheckConfig: {
    path: '/health',
  },
})

export const serviceUrl = service.loadBalancer.dnsName
```

### With Custom Image and Environment Variables

```typescript
import { ecs, ecr, image } from 'infra-foundry'
import * as pulumi from '@pulumi/pulumi'

// Create ECR repository
const repo = new ecr.EcrRepository({
  name: 'my-app',
  maxImages: 5,
})

// Build and push Docker image
const appImage = new image.Image({
  imageName: 'my-app',
  repositoryUrl: repo.repository.repositoryUrl,
  context: './app',
  dockerfile: './app/Dockerfile',
})

// Create ECS service
const service = new ecs.EcsService({
  name: 'my-app',
  image: appImage.imageUri,
  port: 3000,
  cpu: 512,
  memory: 1024,
  desiredCount: 2,
  environment: {
    NODE_ENV: 'production',
    PORT: '3000',
  },
  dnsConfig: {
    domainName: 'api.example.com',
    zoneId: hostedZone.zoneId,
  },
  healthCheckConfig: {
    path: '/health',
    interval: 30,
    timeout: 5,
  },
})
```

### With Secrets and S3 Access

```typescript
import { ecs, secret, s3 } from 'infra-foundry'

// Create secrets
const appSecrets = new secret.Secret({
  name: 'my-app-secrets',
  secrets: {
    DATABASE_URL: 'postgresql://...',
    API_KEY: 'secret-key',
  },
})

// Create S3 bucket
const bucket = new s3.S3Bucket({
  name: 'my-app-data',
})

// Create ECS service with access to secrets and S3
const service = new ecs.EcsService({
  name: 'my-app',
  image: 'my-app:latest',
  port: 3000,
  secretName: appSecrets.secret.name,
  bucketNames: [bucket.assetBucket.id],
  environment: {
    BUCKET_NAME: bucket.assetBucket.id,
  },
  dnsConfig: {
    domainName: 'api.example.com',
    zoneId: hostedZone.zoneId,
  },
  healthCheckConfig: {
    path: '/health',
  },
})
```

## Configuration

### EcsClusterConfig

| Property | Type     | Required | Description             |
| -------- | -------- | -------- | ----------------------- |
| `name`   | `string` | Yes      | Name of the ECS cluster |

### EcsServiceConfig

| Property             | Type                                       | Required | Default     | Description                      |
| -------------------- | ------------------------------------------ | -------- | ----------- | -------------------------------- |
| `name`               | `string`                                   | Yes      | -           | Name of the ECS service          |
| `image`              | `string \| Output<string>`                 | Yes      | -           | Docker image to deploy           |
| `port`               | `number`                                   | Yes      | -           | Container port to expose         |
| `cpu`                | `number`                                   | No       | `256`       | CPU units (256 = 0.25 vCPU)      |
| `memory`             | `number`                                   | No       | `512`       | Memory in MB                     |
| `desiredCount`       | `number`                                   | No       | `1`         | Number of tasks to run           |
| `environment`        | `Record<string, string \| Output<string>>` | No       | `{}`        | Environment variables            |
| `secretName`         | `string \| Output<string>`                 | No       | `undefined` | AWS Secrets Manager secret name  |
| `bucketNames`        | `(string \| Output<string>)[]`             | No       | `[]`        | S3 bucket names for access       |
| `sesIdentityEmail`   | `string`                                   | No       | `undefined` | SES email identity for sending   |
| `enableLoadBalancer` | `boolean`                                  | No       | `true`      | Enable Application Load Balancer |
| `dnsConfig`          | `EcsDnsConfig`                             | Yes      | -           | DNS configuration                |
| `healthCheckConfig`  | `EcsHealthCheckConfig`                     | Yes      | -           | Health check configuration       |

### EcsDnsConfig

| Property     | Type             | Required | Description                     |
| ------------ | ---------------- | -------- | ------------------------------- |
| `domainName` | `string`         | Yes      | Domain name for the service     |
| `zoneId`     | `Output<string>` | Yes      | Route53 hosted zone ID          |
| `apexDomain` | `string`         | No       | Apex domain for ACM certificate |

### EcsHealthCheckConfig

| Property   | Type     | Required | Default | Description                     |
| ---------- | -------- | -------- | ------- | ------------------------------- |
| `path`     | `string` | Yes      | -       | Health check endpoint path      |
| `interval` | `number` | No       | `30`    | Health check interval (seconds) |
| `timeout`  | `number` | No       | `5`     | Health check timeout (seconds)  |

## Outputs

### EcsCluster

#### cluster

Type: `ecs.Cluster`

The ECS cluster resource.

### EcsService

#### service

Type: `awsx.ecs.FargateService`

The ECS Fargate service.

#### loadBalancer

Type: `lb.LoadBalancer`

The Application Load Balancer.

#### targetGroup

Type: `lb.TargetGroup`

The target group for the service.

#### taskRole

Type: `iam.Role`

The IAM role for the ECS task.

## IAM Permissions

The ECS service automatically creates IAM roles with permissions for:

- **Secrets Manager**: Read access to specified secrets
- **S3**: Read/write access to specified buckets
- **SES**: Send email from specified identity
- **CloudWatch Logs**: Write logs
- **ECR**: Pull container images

## Complete Example

```typescript
import * as pulumi from '@pulumi/pulumi'
import { vpc, ecs, ecr, image, secret, s3, route53 } from 'infra-foundry'

const config = new pulumi.Config()

// Create VPC
const network = new vpc.Vpc('my-app')

// Create hosted zone
const zone = route53.createHostedZone({
  name: 'example.com',
})

// Create ECR repository
const repo = new ecr.EcrRepository({
  name: 'my-api',
  maxImages: 10,
})

// Build Docker image
const appImage = new image.Image({
  imageName: 'my-api',
  repositoryUrl: repo.repository.repositoryUrl,
  context: './api',
  dockerfile: './api/Dockerfile',
})

// Create secrets
const appSecrets = new secret.Secret({
  name: 'my-api-secrets',
  secrets: {
    DATABASE_URL: config.requireSecret('databaseUrl'),
    JWT_SECRET: config.requireSecret('jwtSecret'),
  },
})

// Create S3 bucket for uploads
const uploadsBucket = new s3.S3Bucket({
  name: 'my-api-uploads',
})

// Create ECS cluster
const cluster = new ecs.EcsCluster({
  name: 'my-app-cluster',
})

// Create ECS service
const apiService = new ecs.EcsService({
  name: 'my-api',
  image: appImage.imageUri,
  port: 3000,
  cpu: 512,
  memory: 1024,
  desiredCount: 2,
  environment: {
    NODE_ENV: 'production',
    PORT: '3000',
    UPLOADS_BUCKET: uploadsBucket.assetBucket.id,
  },
  secretName: appSecrets.secret.name,
  bucketNames: [uploadsBucket.assetBucket.id],
  dnsConfig: {
    domainName: 'api.example.com',
    zoneId: zone.apply((z) => z.zone.zoneId),
  },
  healthCheckConfig: {
    path: '/health',
    interval: 30,
    timeout: 5,
  },
})

// Export outputs
export const apiUrl = apiService.loadBalancer.dnsName
export const clusterName = cluster.cluster.name
export const serviceName = apiService.service.service.name
```

## Use Cases

1. **REST APIs**: Deploy Node.js, Python, Go APIs
2. **GraphQL Services**: Run GraphQL servers
3. **Background Workers**: Process queues and jobs
4. **Microservices**: Deploy multiple interconnected services
5. **Web Applications**: Run server-rendered applications

## Best Practices

1. **Health Checks**: Always implement a `/health` endpoint
2. **Resource Sizing**: Start small (256 CPU, 512 MB) and scale up based on metrics
3. **Secrets**: Use Secrets Manager for sensitive data, not environment variables
4. **Logging**: Use structured logging (JSON) for better CloudWatch integration
5. **Graceful Shutdown**: Handle SIGTERM for zero-downtime deployments
6. **Auto-scaling**: Configure auto-scaling based on CPU/memory metrics

## Related Components

- [VPC](./vpc.md) - Required for ECS networking
- [ECR](./ecr.md) - Container registry for Docker images
- [Image](./image.md) - Build and push Docker images
- [Secret](./secret.md) - Manage application secrets
- [Route53](./route53.md) - DNS management

## Troubleshooting

### Issue: Service fails to start

Check CloudWatch Logs for container errors:

```bash
aws logs tail /ecs/my-service --follow
```

### Issue: Health checks failing

1. Ensure your app responds to the health check path
2. Verify the port matches your container port
3. Check security group rules allow traffic

### Issue: Cannot pull Docker image

1. Verify ECR repository permissions
2. Ensure task role has ECR pull permissions
3. Check image URI is correct
