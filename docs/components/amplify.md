# Amplify Component

The Amplify component provides AWS Amplify hosting for static sites and single-page applications with built-in CI/CD from GitHub repositories.

## Features

- Automatic builds from GitHub repository
- Monorepo support with configurable app root
- Custom domain support
- Environment variables configuration
- Automatic HTTPS certificates
- Built-in CI/CD pipeline
- IAM role management

## Usage

### Basic Example

```typescript
import { amplify } from 'infra-foundry'
import * as pulumi from '@pulumi/pulumi'

const config = new pulumi.Config()
const githubToken = config.requireSecret('githubToken')

const app = new amplify.AmplifyApp({
  name: 'my-web-app',
  repository: 'https://github.com/username/repo',
  branchName: 'main',
  githubAccessToken: githubToken,
})

export const appUrl = app.branch.displayName
```

### With Custom Domain

```typescript
import { amplify } from 'infra-foundry'
import * as pulumi from '@pulumi/pulumi'

const config = new pulumi.Config()
const githubToken = config.requireSecret('githubToken')

const app = new amplify.AmplifyApp({
  name: 'my-web-app',
  repository: 'https://github.com/username/repo',
  branchName: 'main',
  domainName: 'example.com',
  githubAccessToken: githubToken,
})

export const appUrl = app.domainAssociation?.domainName
```

### Monorepo Configuration

```typescript
import { amplify } from 'infra-foundry'
import * as pulumi from '@pulumi/pulumi'

const config = new pulumi.Config()
const githubToken = config.requireSecret('githubToken')

const app = new amplify.AmplifyApp({
  name: 'my-web-app',
  repository: 'https://github.com/username/monorepo',
  branchName: 'main',
  appRoot: 'apps/frontend', // Path to app in monorepo
  githubAccessToken: githubToken,
  environmentVariables: {
    API_URL: 'https://api.example.com',
    NODE_ENV: 'production',
  },
})
```

## Configuration

### AmplifyAppConfig

| Property               | Type                     | Required | Default     | Description                               |
| ---------------------- | ------------------------ | -------- | ----------- | ----------------------------------------- |
| `name`                 | `string`                 | Yes      | -           | Name of the Amplify application           |
| `repository`           | `string`                 | Yes      | -           | GitHub repository URL                     |
| `branchName`           | `string`                 | Yes      | -           | Git branch to deploy                      |
| `githubAccessToken`    | `string`                 | Yes      | -           | GitHub personal access token              |
| `appRoot`              | `string`                 | No       | `'.'`       | Root directory of the app (for monorepos) |
| `domainName`           | `string`                 | No       | `undefined` | Custom domain name                        |
| `environmentVariables` | `Record<string, string>` | No       | `{}`        | Environment variables for build           |

## Outputs

### app

Type: `amplify.App`

The Amplify application resource.

```typescript
const app = new amplify.AmplifyApp({ ... })
console.log(app.app.id) // App ID
console.log(app.app.defaultDomain) // Default Amplify domain
```

### branch

Type: `amplify.Branch`

The Amplify branch resource.

```typescript
const app = new amplify.AmplifyApp({ ... })
export const branchUrl = app.branch.displayName
```

### domainAssociation

Type: `amplify.DomainAssociation | undefined`

The custom domain association (if `domainName` is provided).

```typescript
const app = new amplify.AmplifyApp({
  domainName: 'example.com',
  ...
})
export const customDomain = app.domainAssociation?.domainName
```

## GitHub Token Setup

You need a GitHub personal access token with the following permissions:

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate new token with these scopes:
   - `repo` (Full control of private repositories)
   - `admin:repo_hook` (Full control of repository hooks)

Store the token securely in Pulumi config:

```bash
pulumi config set --secret githubToken ghp_xxxxxxxxxxxxx
```

## Environment Variables

The component automatically sets these environment variables:

- `NODE_ENV`: Current environment (from context)
- `AMPLIFY_DIFF_DEPLOY`: Enabled for faster deployments
- `AMPLIFY_DIFF_DEPLOY_ROOT`: Set to `appRoot`
- `AMPLIFY_MONOREPO_APP_ROOT`: Set to `appRoot`
- `_LIVE_UPDATES`: Amplify CLI auto-update configuration

You can add custom environment variables via the `environmentVariables` config.

## Build Specification

The component uses a monorepo-aware build specification:

```yaml
version: 1
applications:
  - appRoot: <your-app-root>
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
```

## Custom Domain Configuration

When using a custom domain:

1. The domain must be registered and managed in Route53 or another DNS provider
2. Amplify will automatically provision an SSL certificate
3. You'll need to add the CNAME records to your DNS provider

```typescript
const app = new amplify.AmplifyApp({
  name: 'my-app',
  domainName: 'www.example.com',
  // ... other config
})

// Export the CNAME records needed
export const domainStatus = app.domainAssociation?.certificateVerificationDnsRecord
```

## Complete Example

```typescript
import * as pulumi from '@pulumi/pulumi'
import { amplify } from 'infra-foundry'

const config = new pulumi.Config()
const githubToken = config.requireSecret('githubToken')
const domain = config.require('domain')

// Create Amplify app
const webApp = new amplify.AmplifyApp({
  name: 'my-saas-app',
  repository: 'https://github.com/myorg/saas-app',
  branchName: 'main',
  appRoot: 'apps/web',
  domainName: `app.${domain}`,
  githubAccessToken: githubToken,
  environmentVariables: {
    VITE_API_URL: config.require('apiUrl'),
    VITE_AUTH_DOMAIN: config.require('authDomain'),
  },
})

// Export outputs
export const appId = webApp.app.id
export const defaultDomain = webApp.app.defaultDomain
export const customDomain = webApp.domainAssociation?.domainName
export const branchName = webApp.branch.branchName
```

## Use Cases

1. **Static Websites**: Deploy static HTML/CSS/JS sites
2. **Single Page Applications**: React, Vue, Angular apps
3. **Jamstack Sites**: Next.js, Gatsby, Nuxt.js (static export)
4. **Documentation Sites**: VitePress, Docusaurus, MkDocs
5. **Monorepo Apps**: Multiple apps in a single repository

## Best Practices

1. **Secure Tokens**: Always use `pulumi config set --secret` for GitHub tokens
2. **Environment Variables**: Use Pulumi config for environment-specific values
3. **Branch Strategy**: Use separate Amplify apps for different environments
4. **Build Optimization**: Leverage Amplify's diff deploy for faster builds
5. **Custom Domains**: Use subdomains for different environments (app.example.com, staging.example.com)

## Related Components

- [S3](./s3.md) - For additional asset storage
- [Route53](./route53.md) - For DNS management
- [Cloudflare](./cloudflare.md) - For additional CDN capabilities

## Troubleshooting

### Issue: Build fails with "npm: command not found"

Ensure your build spec includes the correct package manager. The default uses `npm ci` and `npm run build`.

### Issue: Custom domain not working

1. Verify DNS records are correctly configured
2. Wait for SSL certificate validation (can take up to 48 hours)
3. Check Amplify console for domain status

### Issue: Environment variables not available

Environment variables are available at build time. For runtime variables in SPAs, prefix them according to your framework (e.g., `VITE_`, `REACT_APP_`, `NEXT_PUBLIC_`).
