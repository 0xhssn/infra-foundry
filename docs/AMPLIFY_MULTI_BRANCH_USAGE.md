# Amplify Multi-Branch Configuration

This document shows how to use the updated Amplify component that supports multiple branches tied to different environments.

## Basic Usage

```typescript
import { AmplifyApp } from '@cloudforge/amplify'
import { Environment } from '@cloudforge/utils'

// Example backend API URLs for different environments
const stagingApiUrl = pulumi.output('https://staging-api.example.com')
const prodApiUrl = pulumi.output('https://api.example.com')

const amplifyApp = new AmplifyApp('my-app', {
  appName: 'my-web-app',
  repositoryUrl: 'https://github.com/myorg/my-web-app',
  githubAccessToken: 'ghp_xxxxxxxxxxxx',
  
  // Configure multiple branches for different environments
  branches: [
    {
      branchName: 'staging',
      environment: Environment.Staging,
      backendApiUrl: stagingApiUrl,
      stage: 'DEVELOPMENT',
      enableAutoBuild: true,
      environmentVariables: {
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'pk_test_staging_key',
        'NEXT_PUBLIC_ANALYTICS_ID': 'GA-STAGING-ID',
      },
    },
    {
      branchName: 'main',
      environment: Environment.Prod,
      backendApiUrl: prodApiUrl,
      stage: 'PRODUCTION',
      enableAutoBuild: true,
      environmentVariables: {
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'pk_live_prod_key',
        'NEXT_PUBLIC_ANALYTICS_ID': 'GA-PROD-ID',
      },
    },
  ],
  
  // Default environment variables applied to all branches
  defaultEnvironmentVariables: {
    'NEXT_PUBLIC_APP_NAME': 'My Web App',
    'NEXT_PUBLIC_VERSION': '1.0.0',
  },
})

// Create domain association with environment-specific subdomains
const domainAssociation = amplifyApp.createDomainAssociation({
  app: amplifyApp.app,
  appName: 'my-web-app',
  domainName: 'example.com',
  branches: amplifyApp.getAllBranches(),
  
  // Optional: Custom subdomain mapping
  subdomainMapping: {
    [Environment.Staging]: 'staging',
    [Environment.Prod]: '', // Apex domain for production
  },
})
```

## Migration from Single Branch

If you're migrating from the old single-branch configuration:

### Before (Single Branch)
```typescript
const amplifyApp = new AmplifyApp('my-app', {
  appName: 'my-web-app',
  repositoryUrl: 'https://github.com/myorg/my-web-app',
  branchName: 'main',
  backendApiUrl: apiUrl,
  githubAccessToken: 'ghp_xxxxxxxxxxxx',
})
```

### After (Multi-Branch)
```typescript
const amplifyApp = new AmplifyApp('my-app', {
  appName: 'my-web-app',
  repositoryUrl: 'https://github.com/myorg/my-web-app',
  githubAccessToken: 'ghp_xxxxxxxxxxxx',
  
  branches: [
    {
      branchName: 'main',
      environment: Environment.Prod,
      backendApiUrl: apiUrl,
    },
  ],
})
```

## Working with Branches

The component provides several helper methods for working with branches:

```typescript
// Get a specific branch by environment
const stagingBranch = amplifyApp.getBranch(Environment.Staging)
const prodBranch = amplifyApp.getBranch(Environment.Prod)

// Get all branches
const allBranches = amplifyApp.getAllBranches()

// Get all configured environments
const environments = amplifyApp.getEnvironments()

// Backward compatibility: get the current environment's branch
const currentBranch = amplifyApp.branch
```

## Domain Configuration

The domain association now supports multiple branches with automatic subdomain configuration:

- **Production** (`Environment.Prod`): Maps to apex domain (e.g., `example.com`)
- **Staging** (`Environment.Staging`): Maps to `staging.example.com`
- **Other environments**: Map to `{environment}.example.com` (e.g., `dev.example.com`)

### Custom Subdomain Mapping

You can override the default subdomain mapping:

```typescript
const domainAssociation = amplifyApp.createDomainAssociation({
  app: amplifyApp.app,
  appName: 'my-web-app',
  domainName: 'example.com',
  branches: amplifyApp.getAllBranches(),
  
  subdomainMapping: {
    [Environment.Staging]: 'stage',      // stage.example.com
    [Environment.Dev]: 'develop',        // develop.example.com
    [Environment.Prod]: '',              // example.com (apex)
  },
})
```

## Environment Variables

Environment variables can be set at multiple levels:

1. **Default variables**: Applied to all branches via `defaultEnvironmentVariables`
2. **Branch-specific variables**: Applied to individual branches via `environmentVariables`
3. **Automatic variables**: `NODE_ENV` is automatically set to the branch's environment

### Variable Precedence
Branch-specific variables override default variables, which override automatic variables.

## Backward Compatibility

The updated component maintains backward compatibility:

- The `branch` property still exists and returns the current environment's branch
- Existing domain association calls will work (though they'll only configure the current branch)
- All existing IAM roles and policies continue to work as before

## Environment Configuration

Make sure your environment enum includes the environments you want to use:

```typescript
// In src/utils/environment.ts
export enum Environment {
  Global = 'global',
  Dev = 'dev',
  QA = 'qa',
  Staging = 'staging',
  Prod = 'prod',
}
```
