# Amplify Monorepo Configuration Example

This example shows how to configure Amplify for a monorepo with the web application located in the `web/` subdirectory.

## Configuration for Monorepo with web/ subdirectory

```typescript
import { AmplifyApp } from '@cloudforge/amplify'
import { Environment } from '@cloudforge/utils'

// Example backend API URLs for different environments
const stagingApiUrl = pulumi.output('https://staging-api.example.com')
const prodApiUrl = pulumi.output('https://api.example.com')

const amplifyApp = new AmplifyApp('my-monorepo-app', {
  appName: 'my-web-app',
  repositoryUrl: 'https://github.com/myorg/my-monorepo',
  githubAccessToken: 'ghp_xxxxxxxxxxxx',

  // Monorepo configuration
  isMonorepo: true,
  appRoot: 'web', // Specify the subdirectory where your web app is located

  // Multiple branches for different environments
  branches: [
    {
      branchName: 'staging',
      environment: Environment.Staging,
      backendApiUrl: stagingApiUrl,
      stage: 'DEVELOPMENT',
      enableAutoBuild: true,
      environmentVariables: {
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_staging_key',
        NEXT_PUBLIC_ANALYTICS_ID: 'GA-STAGING-ID',
      },
    },
    {
      branchName: 'main',
      environment: Environment.Prod,
      backendApiUrl: prodApiUrl,
      stage: 'PRODUCTION',
      enableAutoBuild: true,
      environmentVariables: {
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_live_prod_key',
        NEXT_PUBLIC_ANALYTICS_ID: 'GA-PROD-ID',
      },
    },
  ],

  // Default environment variables applied to all branches
  defaultEnvironmentVariables: {
    NEXT_PUBLIC_APP_NAME: 'My Web App',
    NEXT_PUBLIC_VERSION: '1.0.0',
  },
})

// Create domain association
const domainAssociation = amplifyApp.createDomainAssociation({
  app: amplifyApp.app,
  appName: 'my-web-app',
  domainName: 'example.com',
  branches: amplifyApp.getAllBranches(),

  // Environment-specific subdomains
  subdomainMapping: {
    [Environment.Staging]: 'staging',
    [Environment.Prod]: '', // Apex domain for production
  },
})
```

## Alternative Configuration Options

### 1. Using Default Monorepo Build Spec (assumes web/ directory)

```typescript
const amplifyApp = new AmplifyApp('my-app', {
  appName: 'my-web-app',
  repositoryUrl: 'https://github.com/myorg/my-monorepo',
  githubAccessToken: 'ghp_xxxxxxxxxxxx',

  // Simple monorepo flag - uses default web/ directory
  isMonorepo: true,

  branches: [
    // ... your branch configurations
  ],
})
```

### 2. Custom App Root Directory

```typescript
const amplifyApp = new AmplifyApp('my-app', {
  appName: 'my-web-app',
  repositoryUrl: 'https://github.com/myorg/my-monorepo',
  githubAccessToken: 'ghp_xxxxxxxxxxxx',

  // Custom subdirectory (e.g., frontend/, client/, etc.)
  appRoot: 'frontend',

  branches: [
    // ... your branch configurations
  ],
})
```

### 3. Fully Custom Build Spec

```typescript
const customMonorepoBuildSpec = `
  version: 1
  frontend:
    phases:
      preBuild:
        commands:
          - yarn install --frozen-lockfile
          - cd web && yarn install
      build:
        commands:
          - cd web && yarn build
    artifacts:
      baseDirectory: web/.next
      files:
        - '**/*'
    cache:
      paths:
        - node_modules/**/*
        - web/node_modules/**/*
        - .yarn-cache/**/*
  appRoot: web
`

const amplifyApp = new AmplifyApp('my-app', {
  appName: 'my-web-app',
  repositoryUrl: 'https://github.com/myorg/my-monorepo',
  githubAccessToken: 'ghp_xxxxxxxxxxxx',

  // Use your fully custom build spec
  buildSpec: customMonorepoBuildSpec,

  branches: [
    // ... your branch configurations
  ],
})
```

## How It Works

### Build Specification Changes

The monorepo configuration automatically adjusts the Amplify build specification:

1. **Standard repos**: Uses `appRoot: .` (repository root)
2. **Monorepos**: Uses `appRoot: web` (or your specified subdirectory)

### Automatic Build Spec Selection

The component automatically chooses the right build spec:

- If `buildSpec` is provided → uses your custom spec
- If `isMonorepo: true` → uses `MONOREPO_BUILD_SPEC` (web/ directory)
- If `appRoot` is specified → generates custom spec with your directory
- Otherwise → uses `DEFAULT_BUILD_SPEC` (standard repo)

### Tagging

Monorepo configurations add helpful tags:

- `Monorepo: 'true'` - when `isMonorepo` is set
- `AppRoot: 'web'` - when `appRoot` is specified

## Repository Structure

Your monorepo should be structured like this:

```
my-monorepo/
├── web/                    # Your Next.js web application
│   ├── package.json
│   ├── next.config.js
│   ├── pages/
│   ├── components/
│   └── ...
├── api/                    # Your backend API (optional)
├── shared/                 # Shared libraries (optional)
├── package.json            # Root package.json
└── yarn.lock              # Root lockfile
```

## Build Process

With this configuration, Amplify will:

1. Clone your repository
2. Run `yarn install --frozen-lockfile` in the root
3. Navigate to the `web/` directory for building
4. Run `yarn build` in the `web/` directory
5. Use `.next` output from the `web/` directory
6. Deploy your application

This setup ensures that Amplify correctly handles your monorepo structure while maintaining support for multiple environments and branches.
