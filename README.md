# 🏗️ Infra Foundry

[![npm version](https://img.shields.io/npm/v/infra-foundry.svg)](https://www.npmjs.com/package/infra-foundry)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A platform-agnostic cloud infrastructure components library for modern applications. Built with TypeScript and Pulumi, Infra Foundry provides reusable, composable infrastructure components that work across AWS, Cloudflare, and other cloud providers.

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
  npm install infra-foundry
  # or
  yarn add infra-foundry
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
