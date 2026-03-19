# ECR Component

The ECR (Elastic Container Registry) component provides a private Docker container registry with automatic image scanning and lifecycle policies.

## Features

- Private container registry
- Automatic image scanning on push
- Lifecycle policies for image retention
- Force delete enabled for easy cleanup
- Configurable image retention count

## Usage

### Basic Example

```typescript
import { ecr } from 'infra-foundry'

const repo = new ecr.EcrRepository({
  name: 'my-app',
})

export const repositoryUrl = repo.repository.repositoryUrl
export const repositoryArn = repo.repository.arn
```

### With Custom Image Retention

```typescript
import { ecr } from 'infra-foundry'

const repo = new ecr.EcrRepository({
  name: 'my-app',
  maxImages: 10, // Keep only 10 most recent images
})
```

### With Image Building

```typescript
import { ecr, image } from 'infra-foundry'

// Create repository
const repo = new ecr.EcrRepository({
  name: 'my-api',
  maxImages: 5,
})

// Build and push image
const appImage = new image.Image({
  imageName: 'my-api',
  repositoryUrl: repo.repository.repositoryUrl,
  context: './app',
  dockerfile: './app/Dockerfile',
})

export const imageUri = appImage.imageUri
```

## Configuration

### EcrRepositoryArgs

| Property    | Type     | Required | Default | Description                        |
| ----------- | -------- | -------- | ------- | ---------------------------------- |
| `name`      | `string` | Yes      | -       | Name of the ECR repository         |
| `maxImages` | `number` | No       | `2`     | Maximum number of images to retain |

## Outputs

### repository

Type: `ecr.Repository`

The ECR repository resource.

```typescript
const repo = new ecr.EcrRepository({ name: 'my-app' })

export const repositoryUrl = repo.repository.repositoryUrl
export const repositoryArn = repo.repository.arn
export const repositoryName = repo.repository.name
```

## Features in Detail

### Image Scanning

- Automatically scans images on push
- Detects vulnerabilities in container images
- View scan results in AWS Console or via CLI

```bash
# View scan results
aws ecr describe-image-scan-findings \
  --repository-name my-app \
  --image-id imageTag=latest
```

### Lifecycle Policy

Automatically deletes old images to save storage costs:

- Retains only the N most recent images (configurable)
- Applies to all images regardless of tag status
- Helps manage storage costs

### Force Delete

- Repository can be deleted even if it contains images
- Useful for development and testing environments
- Simplifies cleanup

## Complete Example

```typescript
import * as pulumi from '@pulumi/pulumi'
import { ecr, image, ecs } from 'infra-foundry'

// Create ECR repository
const apiRepo = new ecr.EcrRepository({
  name: 'my-api',
  maxImages: 10,
})

// Build and push Docker image
const apiImage = new image.Image({
  imageName: 'my-api',
  repositoryUrl: apiRepo.repository.repositoryUrl,
  context: './api',
  dockerfile: './api/Dockerfile',
  buildArgs: {
    NODE_ENV: 'production',
  },
})

// Deploy to ECS
const service = new ecs.EcsService({
  name: 'my-api',
  image: apiImage.imageUri,
  port: 3000,
  dnsConfig: {
    domainName: 'api.example.com',
    zoneId: hostedZone.zoneId,
  },
  healthCheckConfig: {
    path: '/health',
  },
})

// Export outputs
export const repositoryUrl = apiRepo.repository.repositoryUrl
export const imageUri = apiImage.imageUri
export const serviceUrl = service.loadBalancer.dnsName
```

## Use Cases

1. **Application Images**: Store Docker images for your applications
2. **CI/CD Pipelines**: Push images from CI/CD workflows
3. **Microservices**: Separate repositories for each service
4. **Multi-environment**: Same repository, different tags per environment

## Best Practices

1. **Image Tagging**: Use semantic versioning or commit SHAs for tags
2. **Retention Policy**: Set `maxImages` based on your rollback needs
3. **Scanning**: Review scan results regularly for vulnerabilities
4. **Access Control**: Use IAM policies to control who can push/pull
5. **Cost Management**: Monitor storage costs and adjust retention

## Image Tagging Strategy

```typescript
import { ecr, image } from 'infra-foundry'
import * as pulumi from '@pulumi/pulumi'

const repo = new ecr.EcrRepository({ name: 'my-app' })

// Tag with git commit SHA
const gitSha = pulumi.output(
  require('child_process').execSync('git rev-parse --short HEAD').toString().trim(),
)

const appImage = new image.Image({
  imageName: 'my-app',
  repositoryUrl: repo.repository.repositoryUrl,
  context: './app',
  tags: [gitSha, 'latest'],
})
```

## Related Components

- [Image](./image.md) - Build and push Docker images
- [ECS](./ecs.md) - Deploy containers from ECR
- [VPC](./vpc.md) - VPC endpoints for ECR access

## Troubleshooting

### Issue: Cannot push images

Ensure you're authenticated to ECR:

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

### Issue: Images being deleted unexpectedly

Check your `maxImages` setting. Increase it to retain more images:

```typescript
const repo = new ecr.EcrRepository({
  name: 'my-app',
  maxImages: 20, // Increase retention
})
```

### Issue: High storage costs

Reduce `maxImages` to keep fewer images:

```typescript
const repo = new ecr.EcrRepository({
  name: 'my-app',
  maxImages: 3, // Keep only 3 most recent
})
```
