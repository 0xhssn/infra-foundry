# Getting Started with Infra Foundry

This guide will help you get started with Infra Foundry, from installation to deploying your first infrastructure component.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Your First Deployment](#your-first-deployment)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed and configured:

### Required Tools

- **Node.js** >= 20.0.0
- **npm** or **yarn** package manager
- **Pulumi CLI** - [Installation Guide](https://www.pulumi.com/docs/get-started/install/)

### Cloud Provider Setup

Depending on which components you plan to use, you'll need:

#### AWS (Required for most components)

- AWS account with appropriate permissions
- AWS CLI installed and configured
- AWS credentials configured (via `aws configure` or environment variables)

```bash
# Install AWS CLI
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure credentials
aws configure
```

#### Cloudflare (Optional)

- Cloudflare account
- API token with appropriate permissions

### Pulumi Setup

1. **Create a Pulumi Account**

   - Sign up at [Pulumi Console](https://app.pulumi.com/)
   - Create an organization

2. **Login to Pulumi**
   ```bash
   pulumi login
   ```

## Installation

### Step 1: Create a New Pulumi Project

```bash
# Create a new directory for your infrastructure
mkdir my-infrastructure && cd my-infrastructure

# Initialize a new Pulumi TypeScript project
pulumi new typescript
```

You'll be prompted to:

- Enter a project name
- Enter a project description
- Enter a stack name (e.g., `dev`, `staging`, `prod`)

### Step 2: Install Infra Foundry

```bash
# Using npm
npm install infra-foundry

# Using yarn
yarn add infra-foundry
```

### Step 3: Install Peer Dependencies

Infra Foundry requires Pulumi provider packages as peer dependencies:

```bash
# Required for AWS components
npm install @pulumi/aws @pulumi/awsx @pulumi/pulumi

# Optional: For Cloudflare components
npm install @pulumi/cloudflare
```

Or with yarn:

```bash
yarn add @pulumi/aws @pulumi/awsx @pulumi/pulumi
yarn add @pulumi/cloudflare  # Optional
```

## Configuration

### Pulumi Stack Configuration

Create or select a stack in your organization:

```bash
# Create a new stack
pulumi stack init <your-org>/<stack-name>

# Or select an existing stack
pulumi stack select <your-org>/<stack-name>
```

### AWS Configuration

Set your AWS region in the Pulumi stack configuration:

```bash
pulumi config set aws:region us-east-1
```

### Environment-Specific Configuration

Set configuration values for your stack:

```bash
# Set configuration values
pulumi config set myapp:domain example.com
pulumi config set myapp:environment production

# Set secret values (encrypted)
pulumi config set --secret myapp:githubToken ghp_xxxxxxxxxxxxx
```

## Your First Deployment

Let's deploy a simple S3 bucket with CloudFront CDN:

### Step 1: Create Your Infrastructure Code

Edit `index.ts` in your project:

```typescript
import * as pulumi from '@pulumi/pulumi'
import { s3 } from 'infra-foundry'

// Create an S3 bucket with CloudFront CDN
const bucket = new s3.S3Bucket({
  name: 'my-static-website',
  contentExpiration: 30, // Optional: expire content after 30 days
})

// Export the CloudFront URL
export const websiteUrl = bucket.cloudfrontDistribution.domainName
export const bucketName = bucket.bucket.id
```

### Step 2: Preview Your Changes

Before deploying, preview what will be created:

```bash
pulumi preview
```

This shows you all the resources that will be created without actually creating them.

### Step 3: Deploy Your Infrastructure

```bash
pulumi up
```

Review the changes and confirm by selecting "yes". Pulumi will create all the resources.

### Step 4: View Your Outputs

After deployment completes, you'll see the exported values:

```bash
pulumi stack output websiteUrl
pulumi stack output bucketName
```

### Step 5: Update Your Infrastructure

Make changes to your `index.ts` file and run:

```bash
pulumi up
```

Pulumi will show you the diff and apply only the necessary changes.

### Step 6: Destroy Resources (Optional)

When you're done, you can destroy all resources:

```bash
pulumi destroy
```

## Best Practices

### 1. Use Stack Configuration

Store environment-specific values in stack configuration instead of hardcoding:

```typescript
const config = new pulumi.Config()
const domain = config.require('domain')
const environment = config.require('environment')
```

### 2. Organize Your Code

For larger projects, organize your infrastructure code into modules:

```
my-infrastructure/
├── index.ts           # Main entry point
├── network/
│   └── vpc.ts        # VPC configuration
├── compute/
│   └── ecs.ts        # ECS services
├── storage/
│   └── s3.ts         # S3 buckets
└── dns/
    └── route53.ts    # DNS records
```

### 3. Use Multiple Stacks

Create separate stacks for different environments:

```bash
pulumi stack init myorg/dev
pulumi stack init myorg/staging
pulumi stack init myorg/prod
```

### 4. Leverage Context Utilities

Infra Foundry provides utilities for common patterns:

```typescript
import { context, commonTags, addEnvSuffix } from 'infra-foundry'

// Access current environment
console.log(context.environment) // 'dev', 'staging', 'prod'

// Add environment suffix to resource names
const bucketName = addEnvSuffix('my-bucket') // 'my-bucket-dev'

// Apply common tags to resources
const tags = commonTags({ project: 'myapp' })
```

### 5. Secure Secrets

Always use Pulumi secrets for sensitive data:

```bash
pulumi config set --secret aws:secretKey xxxxx
pulumi config set --secret github:token ghp_xxxxx
```

### 6. Version Control

Commit your Pulumi code to version control, but exclude:

```gitignore
# .gitignore
node_modules/
dist/
.pulumi/
Pulumi.*.yaml  # Stack-specific config (may contain secrets)
```

Use `Pulumi.yaml` (project config) in version control, but be careful with stack configs.

## Troubleshooting

### Common Issues

#### Issue: "No valid credential sources found"

**Solution**: Configure AWS credentials:

```bash
aws configure
# Or set environment variables
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
```

#### Issue: "error: could not load plugin for aws provider"

**Solution**: Install the AWS provider:

```bash
pulumi plugin install resource aws v6.82.1
```

#### Issue: "stack not found"

**Solution**: Create or select a stack:

```bash
pulumi stack init <org>/<stack-name>
# or
pulumi stack select <org>/<stack-name>
```

#### Issue: TypeScript compilation errors

**Solution**: Ensure all peer dependencies are installed:

```bash
npm install @pulumi/aws @pulumi/awsx @pulumi/pulumi
```

### Getting Help

- **Documentation**: Check component-specific docs in [components/](./components/)
- **Examples**: See [examples/](./examples/) for working code samples
- **Issues**: Report bugs at [GitHub Issues](https://github.com/0xhssn/infra-foundry/issues)
- **Discussions**: Ask questions at [GitHub Discussions](https://github.com/0xhssn/infra-foundry/discussions)

## Next Steps

- Explore [Components Documentation](./components/) to learn about available components
- Check out [Examples](./examples/) for real-world usage patterns
- Read the [API Reference](./api-reference.md) for detailed API documentation
- Review [Contributing Guidelines](../CONTRIBUTING.md) if you want to contribute

## Additional Resources

- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Infra Foundry GitHub](https://github.com/0xhssn/infra-foundry)
