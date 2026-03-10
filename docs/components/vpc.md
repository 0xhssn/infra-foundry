# VPC Component

The VPC component provides a complete AWS Virtual Private Cloud setup with VPC endpoints for secure, private access to AWS services.

## Features

- VPC with configurable CIDR block (default: 10.0.0.0/16)
- Multi-AZ deployment (2 availability zones)
- Public and private subnets
- VPC endpoints for AWS services (ECR, S3, CloudWatch Logs)
- Security groups for VPC endpoints
- DNS support enabled
- No NAT gateways (cost-optimized for Fargate)

## Usage

### Basic Example

```typescript
import { vpc } from 'infra-foundry'

const network = new vpc.Vpc('my-app')

export const vpcId = network.vpc.vpcId
export const publicSubnetIds = network.vpc.publicSubnetIds
export const privateSubnetIds = network.vpc.privateSubnetIds
```

### With ECS Service

```typescript
import { vpc, ecs } from 'infra-foundry'

// Create VPC
const network = new vpc.Vpc('my-app')

// Use VPC with ECS
const service = new ecs.EcsService({
  name: 'my-service',
  image: 'nginx:latest',
  port: 80,
  // VPC is automatically used by ECS components
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

The VPC component takes a single parameter:

| Property | Type     | Required | Description                                 |
| -------- | -------- | -------- | ------------------------------------------- |
| `name`   | `string` | Yes      | Base name for the VPC and related resources |

The name will automatically have an environment suffix added (e.g., `my-app-dev`).

## Outputs

### vpc

Type: `awsx.ec2.Vpc`

The VPC resource with all networking components.

```typescript
const network = new vpc.Vpc('my-app')

export const vpcId = network.vpc.vpcId
export const publicSubnetIds = network.vpc.publicSubnetIds
export const privateSubnetIds = network.vpc.privateSubnetIds
```

### vpceSg

Type: `aws.ec2.SecurityGroup`

Security group for VPC endpoints allowing HTTPS traffic.

### ecrApiEndpoint

Type: `aws.ec2.VpcEndpoint`

VPC endpoint for ECR API (ecr.api).

### ecrDkrEndpoint

Type: `aws.ec2.VpcEndpoint`

VPC endpoint for ECR Docker registry (ecr.dkr).

### s3Endpoint

Type: `aws.ec2.VpcEndpoint`

VPC endpoint for S3 (gateway endpoint).

### logsEndpoint

Type: `aws.ec2.VpcEndpoint`

VPC endpoint for CloudWatch Logs.

## VPC Configuration Details

### CIDR Block

- Default: `10.0.0.0/16`
- Provides 65,536 IP addresses

### Availability Zones

- Deploys across 2 availability zones for high availability
- Creates both public and private subnets in each AZ

### NAT Gateways

- Strategy: `None`
- Cost-optimized for Fargate workloads using VPC endpoints
- Services access AWS APIs via VPC endpoints instead of NAT

### VPC Endpoints

The component creates VPC endpoints for:

1. **ECR API** - Pull container images from ECR
2. **ECR Docker** - Docker registry operations
3. **S3** - Access S3 buckets (gateway endpoint, no cost)
4. **CloudWatch Logs** - Send logs to CloudWatch

These endpoints allow Fargate tasks in private subnets to access AWS services without internet access.

## Complete Example

```typescript
import * as pulumi from '@pulumi/pulumi'
import { vpc, ecs, ecr, image } from 'infra-foundry'

// Create VPC
const network = new vpc.Vpc('my-app')

// Create ECR repository
const repo = new ecr.EcrRepository({
  name: 'my-api',
})

// Build Docker image
const appImage = new image.Image({
  imageName: 'my-api',
  repositoryUrl: repo.repository.repositoryUrl,
  context: './api',
})

// Create ECS service (automatically uses VPC)
const service = new ecs.EcsService({
  name: 'my-api',
  image: appImage.imageUri,
  port: 3000,
  dnsConfig: {
    domainName: 'api.example.com',
    zoneId: hostedZone.zoneId,
  },
  healthCheckConfig: {
    path: '/health',
  },
})

// Export VPC details
export const vpcId = network.vpc.vpcId
export const vpcCidr = network.vpc.vpc.cidrBlock
export const publicSubnets = network.vpc.publicSubnetIds
export const privateSubnets = network.vpc.privateSubnetIds
export const ecrApiEndpointId = network.ecrApiEndpoint.id
export const s3EndpointId = network.s3Endpoint.id
```

## Use Cases

1. **ECS Fargate**: Required for running ECS services
2. **Private Services**: Run services without public internet access
3. **Secure Architecture**: Isolate resources in private subnets
4. **Multi-tier Applications**: Separate public and private resources

## Best Practices

1. **One VPC per Environment**: Create separate VPCs for dev, staging, prod
2. **Use VPC Endpoints**: Leverage included endpoints to avoid NAT gateway costs
3. **Security Groups**: Use security groups to control traffic between services
4. **Subnet Planning**: Use public subnets for load balancers, private for services
5. **Monitoring**: Enable VPC Flow Logs for network traffic analysis

## Cost Optimization

The VPC component is optimized for cost:

- **No NAT Gateways**: Saves ~$32/month per AZ
- **Gateway Endpoints**: S3 endpoint is free
- **Interface Endpoints**: Only essential endpoints included (~$7/month each)

For production workloads with high traffic, consider:

- Adding NAT gateways for internet access
- Using VPC endpoint policies to restrict access
- Monitoring data transfer costs

## Security Features

### Network Isolation

- Private subnets for application workloads
- Public subnets for load balancers only
- No direct internet access from private subnets

### VPC Endpoint Security

- Security group restricts traffic to HTTPS (port 443)
- Private DNS enabled for seamless service access
- No data traverses the public internet

### DNS Configuration

- DNS support enabled
- DNS hostnames enabled
- Private DNS for VPC endpoints

## Related Components

- [ECS](./ecs.md) - Deploy containerized applications in the VPC
- [ECR](./ecr.md) - Container registry accessible via VPC endpoint
- [S3](./s3.md) - Object storage accessible via VPC endpoint

## Troubleshooting

### Issue: ECS tasks cannot pull images from ECR

Ensure VPC endpoints are properly configured:

```typescript
const network = new vpc.Vpc('my-app')
// ECR endpoints are automatically created
```

### Issue: High data transfer costs

If you need internet access, add NAT gateways:

```typescript
// Note: This requires customizing the component
// The default configuration uses VPC endpoints instead
```

### Issue: Cannot access S3 from private subnet

The S3 VPC endpoint is automatically created. Ensure your route tables are properly configured (handled automatically by the component).

## Advanced Configuration

For advanced VPC configurations, you may need to:

1. Customize CIDR blocks
2. Add additional VPC endpoints
3. Configure VPC peering
4. Set up Transit Gateway connections
5. Enable VPC Flow Logs

These features may require extending the component or creating custom resources.
