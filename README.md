# 🏗️ Infra Foundary

A platform-agnostic cloud infrastructure components library for modern applications. Built with TypeScript and Pulumi, Infra Foundary provides reusable, composable infrastructure components that work across AWS, Cloudflare, and other cloud providers.

## 📊 Version

Current version: **0.3.0**

## ✨ Features

- **🔧 Reusable Components** - Pre-built factories for common cloud services
- **🌍 Platform Agnostic** - Works with AWS, Cloudflare, and other providers
- **📦 TypeScript First** - Full type safety and IntelliSense support
- **⚡ Pulumi Powered** - Leverages Pulumi's infrastructure as code capabilities
- **🎯 Production Ready** - Battle-tested components used in production environments

## 🚀 Quick Start

- Create a new Pulumi project
  ```bash
  mkdir my-infrastructure && cd my-infrastructure
  pulumi new typescript
  ```
- In your infra project repo

  ```bash
  # Install directly from GitHub
  yarn add git+ssh://git@github.com/0xhssn/infra-foundary.git

  # or add as dependency in package.json
  "dependencies": {
    ...
    "infra-foundary": "git+ssh://git@github.com/0xhssn/infra-foundary.git",
    ...
  }
  # and then install
  yarn install
  ```

- Create a Pulumi Organisation via Pulumi console
- Create and select a stack in your organization

  ```bash
  # stack-name refers to the environment to be deployed ex. `prod`, `dev`
  pulumi stack init <your-org>/<stack-name>
  ```

- Preview your infrastructure changes

  ```bash
  pulumi preview --stack <your-org>/<stack-name>
  ```

- Deploy your infrastructure
  ```bash
  pulumi up --stack <your-org>/<stack-name>
  ```

## 📦 Available Components

- **Amplify** - Static site hosting and CI/CD
- **S3** - Object storage buckets and configurations
- **Route53** - DNS hosting and record management
- **Cloudflare** - CDN and DNS records
- **Amazon SES** - Automated Emails

## 🏗️ Project Structure

```
src/
├── amplify/           # AWS Amplify components
│   ├── component.ts
│   ├── types.ts
│   ├── iam.ts
│   └── index.ts
├── route53/           # AWS Route53 components
├── s3/                # AWS S3 components
├── cloudflare/        # Cloudflare components
└── utils/             # Shared utilities
    ├── addEnvSuffix.ts
    ├── domain.ts
    └── tags.ts
```

## 🛠️ Development

### Prerequisites

- Node.js >= 20.0.0
- TypeScript >= 5.0.0
- Pulumi CLI

### Setup

```bash
# Clone the repository
git clone https://github.com/0xhssn/infra-foundary.git
cd infra-foundary

# Install dependencies
yarn install

# Build the project
yarn build
```

### Code Quality

```bash
# Run linting
yarn lint

# Fix linting issues
yarn lint:fix

# Format code
yarn format

# Check formatting
yarn format:check
```

## 🔗 Linking your Repository for CI

To set up continuous integration for your infrastructure repository:

### 1. Create a new SSH key pair

```bash
# Generate a new SSH key pair for CI/CD
ssh-keygen -t ed25519 -C "your_name@flatout.solutions" -f ~/.ssh/ci_deploy_key
```

### 2. Add private key to repository secrets

- Go to your repository settings on GitHub
- Navigate to "Secrets and variables" → "Actions"
- Add the private key content as a repository secret named `SSH_PRIVATE_KEY`
- Copy the content of `~/.ssh/ci_deploy_key` (the private key)

### 3. Share public key with contributors

- Copy the content of `~/.ssh/ci_deploy_key.pub` (the public key)
- Share this public key with contributors of this repository

## 🚀 Release Automation

Infra Foundary uses [semantic-release](https://semantic-release.gitbook.io/) for fully automated version management and package publishing. Versions are determined automatically based on commit messages following [Conventional Commits](https://www.conventionalcommits.org/).

### How It Works

1. **Commit Analysis**: Commits are analyzed to determine the next version bump
2. **Changelog Generation**: CHANGELOG.md is automatically updated
3. **NPM Publishing**: Package is published to npm registry
4. **GitHub Release**: A GitHub release is created with release notes

### Release Channels

| Branch  | Channel     | Example Version |
| ------- | ----------- | --------------- |
| `main`  | Stable      | `1.2.3`         |
| `beta`  | Pre-release | `1.2.3-beta.1`  |
| `alpha` | Pre-release | `1.2.3-alpha.1` |

### Setting Up NPM_TOKEN

To enable automated npm publishing, add the `NPM_TOKEN` secret to your repository:

1. Go to [npmjs.com](https://www.npmjs.com/) → Access Tokens
2. Generate New Token → Select "Automation" type
3. Copy the token
4. In GitHub: Repository → Settings → Secrets and variables → Actions
5. Add new secret: Name = `NPM_TOKEN`, Value = your token

### Version Bump Rules

| Commit Type     | Example             | Version Bump  |
| --------------- | ------------------- | ------------- |
| Breaking change | `feat(s3)!: ...`    | Major (1.0.0) |
| Feature         | `feat(ecs): ...`    | Minor (0.1.0) |
| Fix             | `fix(amplify): ...` | Patch (0.0.1) |

## 📖 Examples

Check out the [examples directory](./examples) for complete infrastructure setups:

- **MFS Infrastructure** - Multi-app Amplify deployment with custom domains
- **Basic Setup** - Simple single-app deployment
- **Advanced Configuration** - Complex multi-environment setup

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [Documentation](https://github.com/0xhssn/infra-foundary#readme)
- [Issue Tracker](https://github.com/0xhssn/infra-foundary/issues)
- [Pulumi Documentation](https://www.pulumi.com/docs/)

---

Built with ❤️ by [Hamza Hassan](https://linkedin.com/in/hhssnn)
