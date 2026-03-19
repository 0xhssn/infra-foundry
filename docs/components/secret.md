# Secret Component

The Secret component provides AWS Secrets Manager integration for securely storing and accessing application secrets.

## Features

- Secure secret storage in AWS Secrets Manager
- Automatic secret rotation support
- JSON-formatted secrets
- Integration with ECS tasks
- Encrypted at rest

## Usage

### Basic Example

```typescript
import { secret } from 'infra-foundry'
import * as pulumi from '@pulumi/pulumi'

const config = new pulumi.Config()

const appSecrets = new secret.Secret({
  name: 'my-app-secrets',
  secrets: {
    DATABASE_URL: config.requireSecret('databaseUrl'),
    API_KEY: config.requireSecret('apiKey'),
    JWT_SECRET: config.requireSecret('jwtSecret'),
  },
})

export const secretArn = appSecrets.secret.arn
export const secretName = appSecrets.secret.name
```

### With ECS Service

```typescript
import { secret, ecs } from 'infra-foundry'
import * as pulumi from '@pulumi/pulumi'

const config = new pulumi.Config()

// Create secrets
const appSecrets = new secret.Secret({
  name: 'my-api-secrets',
  secrets: {
    DATABASE_URL: config.requireSecret('databaseUrl'),
    REDIS_URL: config.requireSecret('redisUrl'),
  },
})

// Use secrets in ECS service
const service = new ecs.EcsService({
  name: 'my-api',
  image: 'my-api:latest',
  port: 3000,
  secretName: appSecrets.secret.name, // ECS will inject these as env vars
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

### SecretConfig

| Property  | Type                                       | Required | Description                |
| --------- | ------------------------------------------ | -------- | -------------------------- |
| `name`    | `string`                                   | Yes      | Name of the secret         |
| `secrets` | `Record<string, string \| Output<string>>` | Yes      | Key-value pairs of secrets |

## Outputs

### secret

Type: `secretsmanager.Secret`

The AWS Secrets Manager secret resource.

```typescript
const appSecrets = new secret.Secret({ ... })

export const secretArn = appSecrets.secret.arn
export const secretName = appSecrets.secret.name
```

## How It Works

The component stores secrets as a JSON object in AWS Secrets Manager:

```json
{
  "DATABASE_URL": "postgresql://...",
  "API_KEY": "secret-key",
  "JWT_SECRET": "random-secret"
}
```

When used with ECS, each key becomes an environment variable in your container.

## Complete Example

```typescript
import * as pulumi from '@pulumi/pulumi'
import { secret, ecs, ecr, image } from 'infra-foundry'

const config = new pulumi.Config()

// Create secrets
const dbSecrets = new secret.Secret({
  name: 'my-app-db',
  secrets: {
    DATABASE_URL: config.requireSecret('databaseUrl'),
    DATABASE_PASSWORD: config.requireSecret('dbPassword'),
  },
})

const appSecrets = new secret.Secret({
  name: 'my-app-config',
  secrets: {
    JWT_SECRET: config.requireSecret('jwtSecret'),
    STRIPE_SECRET_KEY: config.requireSecret('stripeKey'),
    SENDGRID_API_KEY: config.requireSecret('sendgridKey'),
  },
})

// Build Docker image
const repo = new ecr.EcrRepository({ name: 'my-app' })
const appImage = new image.Image({
  imageName: 'my-app',
  repositoryUrl: repo.repository.repositoryUrl,
  context: './app',
})

// Deploy with secrets
const service = new ecs.EcsService({
  name: 'my-app',
  image: appImage.imageUri,
  port: 3000,
  secretName: appSecrets.secret.name,
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
  },
})

export const secretArns = {
  db: dbSecrets.secret.arn,
  app: appSecrets.secret.arn,
}
```

## Best Practices

1. **Separate Secrets**: Create separate secrets for different concerns (DB, API keys, etc.)
2. **Use Pulumi Secrets**: Store sensitive values in Pulumi config with `--secret` flag
3. **Rotation**: Enable automatic rotation for database credentials
4. **Least Privilege**: Grant only necessary permissions to access secrets
5. **Audit**: Enable CloudTrail logging for secret access

## Accessing Secrets

### In ECS Tasks

Secrets are automatically injected as environment variables:

```javascript
// In your application code
const databaseUrl = process.env.DATABASE_URL
const apiKey = process.env.API_KEY
```

### Via AWS CLI

```bash
aws secretsmanager get-secret-value \
  --secret-id my-app-secrets \
  --query SecretString \
  --output text | jq
```

### Via AWS SDK

```javascript
const AWS = require('aws-sdk')
const client = new AWS.SecretsManager()

const secret = await client
  .getSecretValue({
    SecretId: 'my-app-secrets',
  })
  .promise()

const secrets = JSON.parse(secret.SecretString)
```

## Security Considerations

- Secrets are encrypted at rest using AWS KMS
- Access is controlled via IAM policies
- ECS task roles automatically get read access
- Secrets are never logged or exposed in Pulumi outputs
- Use Pulumi secrets for storing values in config

## Related Components

- [ECS](./ecs.md) - Automatic secret injection in containers

## Troubleshooting

### Issue: ECS task cannot access secrets

Ensure the ECS task role has permissions:

```typescript
// This is handled automatically by the ECS component
// when you specify secretName
```

### Issue: Secret not updating in running tasks

Restart ECS tasks to pick up new secret values:

```bash
aws ecs update-service \
  --cluster my-cluster \
  --service my-service \
  --force-new-deployment
```
