# Infra Foundry Documentation

Welcome to the comprehensive documentation for Infra Foundry - a production-ready cloud infrastructure components library built with TypeScript and Pulumi.

## Table of Contents

- [Getting Started](./getting-started.md)
- [API Reference](./api-reference.md)
- [Components](#components)
- [Examples](#examples)
- [Contributing](../CONTRIBUTING.md)

## Overview

Infra Foundry provides reusable, composable infrastructure components that work across AWS, Cloudflare, and other cloud providers. Built with TypeScript and Pulumi, it offers full type safety and IntelliSense support for modern infrastructure as code.

### Key Features

- **Reusable Components** - Pre-built factories for common cloud services
- **Platform Agnostic** - Works with AWS, Cloudflare, and other providers
- **TypeScript First** - Full type safety and IntelliSense support
- **Pulumi Powered** - Leverages Pulumi's infrastructure as code capabilities
- **Production Ready** - Battle-tested components used in production environments

## Components

Infra Foundry includes the following infrastructure components:

### AWS Components

- **[Amplify](./components/amplify.md)** - Static site hosting and CI/CD with AWS Amplify
- **[ECR](./components/ecr.md)** - Container registry management
- **[ECS](./components/ecs.md)** - Fargate container orchestration
- **[Route53](./components/route53.md)** - DNS hosting and record management
- **[S3](./components/s3.md)** - Object storage with CloudFront CDN
- **[Secret](./components/secret.md)** - AWS Secrets Manager integration
- **[SES](./components/ses.md)** - Email services
- **[VPC](./components/vpc.md)** - Virtual private cloud networking

### Multi-Cloud Components

- **[Cloudflare](./components/cloudflare.md)** - CDN and DNS records
- **[Image](./components/image.md)** - Docker image building

## Examples

Explore practical examples of using Infra Foundry components:

- **[Basic Web Application](./examples/basic-web-app.md)** - Deploy a simple web application with S3 and CloudFront
- **[Containerized Application](./examples/containerized-app.md)** - Deploy a containerized application with ECS Fargate
- **[Static Site with Custom Domain](./examples/static-site.md)** - Deploy a static site with Amplify and custom domain
- **[Multi-Service Architecture](./examples/multi-service.md)** - Build a complete application with multiple services

## Quick Links

- [Installation Guide](./getting-started.md#installation)
- [Configuration](./getting-started.md#configuration)
- [Best Practices](./getting-started.md#best-practices)
- [Troubleshooting](./getting-started.md#troubleshooting)

## Support

- **Issues**: [GitHub Issues](https://github.com/0xhssn/infra-foundry/issues)
- **Discussions**: [GitHub Discussions](https://github.com/0xhssn/infra-foundry/discussions)
- **Documentation**: [Main README](../README.md)

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
