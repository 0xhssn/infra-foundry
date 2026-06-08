# 🏗️ Infra Foundry

[![npm version](https://img.shields.io/npm/v/infra-foundry.svg)](https://www.npmjs.com/package/infra-foundry)
[![npm downloads](https://img.shields.io/npm/dm/infra-foundry.svg)](https://www.npmjs.com/package/infra-foundry)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A platform-agnostic cloud infrastructure components library for modern applications. Built with TypeScript and Pulumi, Infra Foundry provides reusable, composable infrastructure components that work across AWS, Cloudflare, and Vercel.

## ✨ Features

- **🔧 Reusable Components** - Pre-built factories for common cloud services
- **🌍 Platform Agnostic** - Works with AWS, Cloudflare, and Vercel
- **📦 TypeScript First** - Full type safety and IntelliSense support
- **⚡ Pulumi Powered** - Leverages Pulumi's infrastructure as code capabilities
- **🎯 Production Ready** - Battle-tested components used in production environments

## 🚀 Quick Start

- Create a new Pulumi project
  ```bash
  mkdir my-infrastructure && cd my-infrastructure
  pulumi new typescript
  ```
- Install the package

  ```bash
  yarn add infra-foundry
  # or
  npm install infra-foundry
  ```

- Create a Pulumi Organisation via the Pulumi console
- Create and select a stack in your organization

  ```bash
  # stack-name refers to the environment to be deployed ex. `prod`, `dev`
  pulumi stack init <your-org>/<stack-name>
  ```

- Preview and deploy your infrastructure
  ```bash
  pulumi preview --stack <your-org>/<stack-name>
  pulumi up --stack <your-org>/<stack-name>
  ```

Each component is exported under its own namespace, so you import only what you need:

```ts
import { s3, vpc, rds } from 'infra-foundry'
```

## 🧩 Components

| Component                           | Provider   | What it does                                       |
| ----------------------------------- | ---------- | -------------------------------------------------- |
| [Amplify](#amplify)                 | AWS        | Static site hosting and CI/CD from a Git repo      |
| [App Runner](#app-runner)           | AWS        | Fully managed container service with autoscaling   |
| [ECR](#ecr)                         | AWS        | Container registry with image lifecycle management |
| [ECS](#ecs)                         | AWS        | Fargate cluster and service orchestration          |
| [Docker Image](#docker-image)       | Docker     | Build and push images to a registry                |
| [Identity Center](#identity-center) | AWS        | SSO admin, permission sets, and team membership    |
| [Organizations](#organizations)     | AWS        | Organizational units under the org root            |
| [RDS](#rds)                         | AWS        | Managed relational database instances              |
| [Route 53](#route-53)               | AWS        | Hosted zones and DNS records                       |
| [S3](#s3)                           | AWS        | Object storage fronted by a CloudFront CDN         |
| [Secrets Manager](#secrets-manager) | AWS        | Versioned secret storage                           |
| [SES](#ses)                         | AWS        | Email sending with DKIM and Route 53 wiring        |
| [SQS](#sqs)                         | AWS        | Standard and FIFO queues with optional DLQ         |
| [VPC](#vpc)                         | AWS        | Virtual private cloud networking                   |
| [Cloudflare](#cloudflare)           | Cloudflare | Nameserver delegation and DNS records              |
| [Vercel](#vercel)                   | Vercel     | Project provisioning with env vars and domains     |

## Amplify

Provision an AWS Amplify app wired to a Git repository, with a managed branch and optional custom domain.

```ts
import { amplify } from 'infra-foundry'

const site = new amplify.AmplifyApp({
  name: 'marketing-site',
  repository: 'https://github.com/acme/marketing-site',
  branchName: 'main',
  githubAccessToken: process.env.GITHUB_TOKEN!,
  domainName: 'acme.com', // optional
})
```

## App Runner

Run a container image on AWS App Runner with health checks, autoscaling, and an optional custom domain.

```ts
import { appRunner } from 'infra-foundry'

const api = new appRunner.AppRunnerService({
  name: 'api',
  image: '123456789012.dkr.ecr.us-east-1.amazonaws.com/api:latest',
  port: '8080',
  healthCheckPath: '/health',
})

export const url = api.serviceUrl
```

## ECR

Create an Elastic Container Registry repository with automatic image lifecycle pruning, plus helpers to resolve image URIs.

```ts
import { ecr } from 'infra-foundry'

const repo = new ecr.EcrRepository({ name: 'api', maxImages: 5 })

export const imageUri = repo.getLatestImageUri()
```

## ECS

Stand up a Fargate cluster and a load-balanced service. The service is created against a cluster and VPC.

```ts
import { ecs, vpc } from 'infra-foundry'

const network = new vpc.Vpc('prod')
const cluster = new ecs.EcsCluster('prod')

const service = new ecs.EcsService(
  'api',
  cluster,
  {
    name: 'api',
    image: 'nginx:latest',
    port: 80,
    dnsConfig: {
      /* domain + hosted zone config */
    },
    healthCheckConfig: {
      /* path, interval, thresholds */
    },
  },
  {
    /* VPC config: subnets, security groups */
  },
)
```

## Docker Image

Build a Docker image from a local context and push it to a registry (for example, the ECR repository above).

```ts
import { image, ecr } from 'infra-foundry'

const repo = new ecr.EcrRepository({ name: 'api' })

const img = new image.DockerImage({
  name: 'api',
  imageName: repo.repository.repositoryUrl,
  buildContext: './app',
  registry: {
    /* { server, username, password } — e.g. from ECR auth */
  },
})
```

## Identity Center

Manage AWS IAM Identity Center (SSO): bootstrap an admin user, define permission sets, and assign team members to accounts.

```ts
import { identityCenter } from 'infra-foundry'

const admin = new identityCenter.IdentityCenterAdmin('admin', {
  adminUsername: 'jane',
  adminGivenName: 'Jane',
  adminFamilyName: 'Doe',
  adminEmail: 'jane@acme.com',
  awsRegion: 'us-east-1',
})
```

## Organizations

Create organizational units under the AWS Organizations root.

```ts
import { organizations } from 'infra-foundry'

const ous = new organizations.OrganizationalUnits('root', {
  ouNames: ['Workloads', 'Sandbox'],
})
```

## RDS

Provision a managed relational database instance with sensible storage defaults.

```ts
import { rds } from 'infra-foundry'

const db = new rds.RdsInstance({
  name: 'app',
  engine: 'postgres',
  engineVersion: '16.3',
  dbName: 'app',
  username: 'app',
  password: dbPassword, // pulumi.Output<string> or string
})
```

## Route 53

Create (or find) a Route 53 hosted zone and manage records for it.

```ts
import { route53 } from 'infra-foundry'

const zone = new route53.HostedZone('acme', { name: 'acme.com' })
```

## S3

Create an S3 bucket fronted by a CloudFront distribution for serving static assets.

```ts
import { s3 } from 'infra-foundry'

const assets = new s3.S3Bucket({ name: 'acme-assets' })

export const cdnDomain = assets.assetsCdn.domainName
```

## Secrets Manager

Store a versioned secret with one or more key/value pairs in AWS Secrets Manager.

```ts
import { secret } from 'infra-foundry'

const creds = new secret.Secret({
  name: 'app/db',
  values: {
    username: 'app',
    password: dbPassword,
  },
})
```

## SES

Set up an SES domain identity with DKIM. Use `SesWithRoute53` to also create the verification and DKIM records in a hosted zone automatically.

```ts
import { ses } from 'infra-foundry'

const email = new ses.Ses('acme', {
  name: 'acme',
  domainName: 'acme.com',
  enableDkim: true,
})
```

## SQS

Create a standard or FIFO queue, optionally with a dead-letter queue and KMS encryption.

```ts
import { sqs } from 'infra-foundry'

const queue = new sqs.SqsQueue({
  name: 'jobs',
  type: 'fifo',
})

export const queueUrl = queue.url
```

## VPC

Provision a VPC with networking primitives ready for ECS and other workloads.

```ts
import { vpc } from 'infra-foundry'

const network = new vpc.Vpc('prod')
```

## Cloudflare

Delegate a domain to Cloudflare nameservers and manage its DNS records.

```ts
import { cloudflare } from 'infra-foundry'

const ns = new cloudflare.CloudflareNameserver('acme', {
  domain: 'acme.com',
  nameServers: zone.nameServers,
})
```

## Vercel

Provision a Vercel project with a framework preset, Git repository, and environment variables.

```ts
import { vercel } from 'infra-foundry'

const app = new vercel.VercelProject('web', {
  name: 'web',
  framework: 'nextjs',
  gitRepo: 'acme/web',
})
```

## 🏗️ Project Structure

```
src/
├── amplify/           # AWS Amplify components
├── app-runner/        # AWS App Runner components
├── cloudflare/        # Cloudflare components
├── ecr/               # AWS ECR components
├── ecs/               # AWS ECS Fargate components
├── identity-center/   # AWS IAM Identity Center (SSO) components
├── image/             # Docker image components
├── organizations/     # AWS Organizations components
├── rds/               # AWS RDS components
├── route53/           # AWS Route 53 components
├── s3/                # AWS S3 components
├── secret/            # AWS Secrets Manager components
├── ses/               # AWS SES components
├── sqs/               # AWS SQS components
├── vercel/            # Vercel components
├── vpc/               # AWS VPC components
└── utils/             # Shared utilities
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [Documentation](https://github.com/0xhssn/infra-foundry#readme)
- [Issue Tracker](https://github.com/0xhssn/infra-foundry/issues)
- [Pulumi Documentation](https://www.pulumi.com/docs/)

---

Built with ❤️ by [Hamza Hassan](https://linkedin.com/in/hhssnn)
