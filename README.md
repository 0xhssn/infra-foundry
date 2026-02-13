# 🏗️ Infra Foundry

A platform-agnostic cloud infrastructure components library for modern applications. Built with TypeScript and Pulumi, Infra Foundry provides reusable, composable infrastructure components that work across AWS, Cloudflare, and other cloud providers.

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
  yarn add git+ssh://git@github.com/0xhssn/infra-foundry.git

  # or add as dependency in package.json
  "dependencies": {
    ...
    "infra-foundry": "git+ssh://git@github.com/0xhssn/infra-foundry.git",
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
- **Cloudflare** - CDN and DNS records
- **ECR** - Container registry management
- **ECS** - Fargate container orchestration
- **Image** - Docker image building
- **Route53** - DNS hosting and record management
- **S3** - Object storage with CloudFront CDN
- **Secret** - AWS Secrets Manager
- **SES** - Email services
- **VPC** - Virtual private cloud networking

## 🏗️ Project Structure

```
src/
├── amplify/           # AWS Amplify components
├── cloudflare/        # Cloudflare components
├── ecr/               # AWS ECR components
├── ecs/               # AWS ECS Fargate components
├── image/             # Docker image components
├── route53/           # AWS Route53 components
├── s3/                # AWS S3 components
├── secret/            # AWS Secrets Manager components
├── ses/               # AWS SES components
├── vpc/               # AWS VPC components
└── utils/             # Shared utilities
```

## 🛠️ Development

### Prerequisites

- Node.js >= 20.0.0
- TypeScript >= 5.0.0
- Pulumi CLI

### Setup

```bash
# Clone the repository
git clone https://github.com/0xhssn/infra-foundry.git
cd infra-foundry

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

## 🚀 Release Automation

Infra Foundry uses [semantic-release](https://semantic-release.gitbook.io/) for fully automated version management and package publishing. Versions are determined automatically based on commit messages following [Conventional Commits](https://www.conventionalcommits.org/).

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
