# API Reference

Complete API reference for all Infra Foundry components and utilities.

## Table of Contents

- [Components](#components)
  - [Amplify](#amplify)
  - [Cloudflare](#cloudflare)
  - [ECR](#ecr)
  - [ECS](#ecs)
  - [Image](#image)
  - [Route53](#route53)
  - [S3](#s3)
  - [Secret](#secret)
  - [SES](#ses)
  - [VPC](#vpc)
- [Utilities](#utilities)
  - [Context](#context)
  - [Common Tags](#common-tags)
  - [Environment Suffix](#environment-suffix)
  - [Domain Utils](#domain-utils)

---

## Components

### Amplify

#### AmplifyApp

Creates an AWS Amplify application with CI/CD from GitHub.

```typescript
import { amplify } from 'infra-foundry'

const app = new amplify.AmplifyApp(config, opts?)
```

**Parameters:**

- `config: AmplifyAppConfig` - Configuration object
- `opts?: ComponentResourceOptions` - Pulumi resource options

**AmplifyAppConfig:**

```typescript
interface AmplifyAppConfig {
  name: string
  repository: string
  branchName: string
  githubAccessToken: string
  appRoot?: string
  domainName?: string
  environmentVariables?: Record<string, string>
}
```

**Outputs:**

- `app: amplify.App` - The Amplify application
- `branch: amplify.Branch` - The deployed branch
- `domainAssociation?: amplify.DomainAssociation` - Custom domain (if configured)

---

### ECR

#### EcrRepository

Creates an ECR repository with lifecycle policies.

```typescript
import { ecr } from 'infra-foundry'

const repo = new ecr.EcrRepository(args, opts?)
```

**Parameters:**

- `args: EcrRepositoryArgs` - Configuration object
- `opts?: ComponentResourceOptions` - Pulumi resource options

**EcrRepositoryArgs:**

```typescript
interface EcrRepositoryArgs {
  name: string
  maxImages?: number // Default: 2
}
```

**Outputs:**

- `repository: ecr.Repository` - The ECR repository

---

### ECS

#### EcsCluster

Creates an ECS cluster.

```typescript
import { ecs } from 'infra-foundry'

const cluster = new ecs.EcsCluster(config, opts?)
```

**Parameters:**

- `config: EcsClusterConfig` - Configuration object
- `opts?: ComponentResourceOptions` - Pulumi resource options

**EcsClusterConfig:**

```typescript
interface EcsClusterConfig {
  name: string
}
```

**Outputs:**

- `cluster: ecs.Cluster` - The ECS cluster

#### EcsService

Creates an ECS Fargate service with load balancer.

```typescript
import { ecs } from 'infra-foundry'

const service = new ecs.EcsService(config, opts?)
```

**Parameters:**

- `config: EcsServiceConfig` - Configuration object
- `opts?: ComponentResourceOptions` - Pulumi resource options

**EcsServiceConfig:**

```typescript
interface EcsServiceConfig {
  name: string
  image: Output<string> | string
  port: number
  cpu?: number // Default: 256
  memory?: number // Default: 512
  environment?: Record<string, string | Output<string>>
  desiredCount?: number // Default: 1
  enableLoadBalancer?: boolean // Default: true
  secretName?: string | Output<string>
  sesIdentityEmail?: string
  bucketNames?: (string | Output<string>)[]
  dnsConfig: EcsDnsConfig
  healthCheckConfig: EcsHealthCheckConfig
}

interface EcsDnsConfig {
  domainName: string
  zoneId: Output<string>
  apexDomain?: string
}

interface EcsHealthCheckConfig {
  path: string
  interval?: number // Default: 30
  timeout?: number // Default: 5
}
```

**Outputs:**

- `service: awsx.ecs.FargateService` - The ECS service
- `loadBalancer: lb.LoadBalancer` - The load balancer
- `targetGroup: lb.TargetGroup` - The target group
- `taskRole: iam.Role` - The task IAM role

---

### Image

#### Image

Builds and pushes a Docker image to ECR.

```typescript
import { image } from 'infra-foundry'

const img = new image.Image(args, opts?)
```

**Parameters:**

- `args: ImageArgs` - Configuration object
- `opts?: ComponentResourceOptions` - Pulumi resource options

**ImageArgs:**

```typescript
interface ImageArgs {
  imageName: string
  repositoryUrl: Output<string> | string
  context: string
  dockerfile?: string
  buildArgs?: Record<string, string>
  tags?: string[]
}
```

**Outputs:**

- `imageUri: Output<string>` - The full image URI with tag

---

### Route53

#### createHostedZone

Creates or finds a Route53 hosted zone.

```typescript
import { route53 } from 'infra-foundry'

const zone = route53.createHostedZone(config)
```

**Parameters:**

- `config: CreateHostedZoneConfig` - Configuration object

**CreateHostedZoneConfig:**

```typescript
interface CreateHostedZoneConfig {
  name: string
  comment?: string
  findExisting?: boolean // Default: false
}
```

**Returns:**

- `FindOrCreateHostedZoneOutput` - Output containing zone and creation status

#### createDnsRecords

Creates DNS records in a hosted zone.

```typescript
import { route53 } from 'infra-foundry'

const records = route53.createDnsRecords(config)
```

**Parameters:**

- `config: { zoneId: Output<string>, records: DnsRecord[] }`

**DnsRecord:**

```typescript
interface DnsRecord {
  name: string
  value: Output<string> | string
  type: string // 'A', 'CNAME', 'TXT', etc.
}
```

---

### S3

#### S3Bucket

Creates an S3 bucket with CloudFront distribution.

```typescript
import { s3 } from 'infra-foundry'

const bucket = new s3.S3Bucket(config, opts?)
```

**Parameters:**

- `config: S3BucketConfig` - Configuration object
- `opts?: ComponentResourceOptions` - Pulumi resource options

**S3BucketConfig:**

```typescript
interface S3BucketConfig {
  name: string
  contentExpiration?: number // Days until content expires
}
```

**Outputs:**

- `assetBucket: s3.Bucket` - The S3 bucket
- `assetsCdn: cloudfront.Distribution` - The CloudFront distribution

---

### Secret

#### Secret

Creates an AWS Secrets Manager secret.

```typescript
import { secret } from 'infra-foundry'

const secrets = new secret.Secret(config, opts?)
```

**Parameters:**

- `config: SecretConfig` - Configuration object
- `opts?: ComponentResourceOptions` - Pulumi resource options

**SecretConfig:**

```typescript
interface SecretConfig {
  name: string
  secrets: Record<string, string | Output<string>>
}
```

**Outputs:**

- `secret: secretsmanager.Secret` - The Secrets Manager secret

---

### VPC

#### Vpc

Creates a VPC with VPC endpoints.

```typescript
import { vpc } from 'infra-foundry'

const network = new vpc.Vpc(name, opts?)
```

**Parameters:**

- `name: string` - VPC name
- `opts?: ComponentResourceOptions` - Pulumi resource options

**Outputs:**

- `vpc: awsx.ec2.Vpc` - The VPC
- `vpceSg: aws.ec2.SecurityGroup` - VPC endpoint security group
- `ecrApiEndpoint: aws.ec2.VpcEndpoint` - ECR API endpoint
- `ecrDkrEndpoint: aws.ec2.VpcEndpoint` - ECR Docker endpoint
- `s3Endpoint: aws.ec2.VpcEndpoint` - S3 endpoint
- `logsEndpoint: aws.ec2.VpcEndpoint` - CloudWatch Logs endpoint

---

## Utilities

### Context

Access the current Pulumi context and environment.

```typescript
import { context } from 'infra-foundry'

console.log(context.environment) // 'dev', 'staging', 'prod', etc.
console.log(context.project) // Pulumi project name
console.log(context.stack) // Pulumi stack name
```

**Type:**

```typescript
interface Context {
  environment: string
  project: string
  stack: string
}
```

---

### Common Tags

Get common tags for AWS resources.

```typescript
import { commonTags } from 'infra-foundry'

const tags = commonTags // Default tags
const customTags = commonTags({ Project: 'MyApp' }) // Merge with custom tags
```

**Returns:**

```typescript
{
  Environment: string
  ManagedBy: 'Pulumi'
  // ... any custom tags
}
```

---

### Environment Suffix

Add environment suffix to resource names.

```typescript
import { addEnvSuffix } from 'infra-foundry'

const name = addEnvSuffix('my-resource')
// Returns: 'my-resource-dev' (in dev environment)
```

**Signature:**

```typescript
function addEnvSuffix(name: string): string
```

---

### Domain Utils

Utilities for domain name manipulation.

```typescript
import { domainUtils } from 'infra-foundry'

// Extract apex domain
const apex = domainUtils.getApexDomain('api.example.com')
// Returns: 'example.com'

// Check if domain is apex
const isApex = domainUtils.isApexDomain('example.com')
// Returns: true
```

**Available Functions:**

```typescript
namespace domainUtils {
  function getApexDomain(domain: string): string
  function isApexDomain(domain: string): boolean
  function getSubdomain(domain: string): string | null
}
```

---

## Type Exports

All TypeScript types are exported for use in your code:

```typescript
import type {
  AmplifyAppConfig,
  EcsServiceConfig,
  S3BucketConfig,
  // ... etc
} from 'infra-foundry'
```

---

## Component Resource Options

All components accept standard Pulumi `ComponentResourceOptions`:

```typescript
import { s3 } from 'infra-foundry'

const bucket = new s3.S3Bucket(
  { name: 'my-bucket' },
  {
    parent: someParentResource,
    dependsOn: [someOtherResource],
    protect: true,
    provider: customProvider,
  },
)
```

---

## Best Practices

1. **Type Safety**: Use TypeScript for full type checking
2. **Resource Options**: Use `parent` to organize resource hierarchy
3. **Dependencies**: Use `dependsOn` for explicit ordering
4. **Protection**: Use `protect: true` for critical resources
5. **Outputs**: Export important values for reference

---

## See Also

- [Getting Started Guide](./getting-started.md)
- [Component Documentation](./components/)
- [Examples](./examples/)
- [Contributing Guide](../CONTRIBUTING.md)
