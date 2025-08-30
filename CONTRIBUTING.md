# Contributing to CloudForge

This guide will help you get started with contributing to our platform-agnostic cloud infrastructure components library.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0
- **Yarn** (preferred) or npm
- **Git**
- **Pulumi CLI** (for testing infrastructure components)
- **AWS CLI** (configured with appropriate credentials)
- **SSH key** configured for GitHub access

### Development Environment Setup

1. **Fork and Clone**

   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone git@github.com:YOUR_USERNAME/CloudForge.git
   cd CloudForge

   # Add upstream remote
   git remote add upstream git@github.com:DopeTechLLC/CloudForge.git
   ```

2. **Install Dependencies**

   ```bash
   yarn install
   ```

3. **Build the Project**

   ```bash
   yarn build
   ```

4. **Verify Setup**

   ```bash
   # Run linting
   yarn lint

   # Check formatting
   yarn format:check
   ```

## 🧪 Testing Your Changes

CloudForge supports two methods for testing your changes in real projects:

### Method 1: Local Linking (Recommended for Development)

This method allows you to test changes in real-time without pushing to GitHub.

1. **Link CloudForge Locally**

   ```bash
   # In the CloudForge directory
   yarn link

   # Build your changes
   yarn build
   ```

2. **Use in Your Test Project**

   ```bash
   # In your test project directory (e.g., MFS or a new test project)
   yarn link @dopetech/cloudforge
   ```

3. **Test Your Changes**

   ```bash
   # Make changes in CloudForge
   cd /path/to/CloudForge
   yarn build  # Rebuild after changes

   # Test in your project
   cd /path/to/your-test-project
   pulumi preview  # or pulumi up for actual deployment
   ```

4. **Unlink When Done**

   ```bash
   # In your test project
   yarn unlink @dopetech/cloudforge

   # In CloudForge directory
   yarn unlink
   ```

### Method 2: GitHub Branch Testing

Use this method to test changes as they would be consumed by end users.

1. **Push Your Changes**

   ```bash
   git checkout -b feature/your-feature-name
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

2. **Install from Your Branch**

   ```bash
   # In your test project
   yarn add git+ssh://git@github.com:YOUR_USERNAME/CloudForge.git#feature/your-feature-name
   ```

3. **Test the Changes**

   ```bash
   # Your test project will now use your branch
   pulumi preview
   ```

4. **Revert to Main When Done**
   ```bash
   # Switch back to main branch
   yarn add git+ssh://git@github.com:DopeTechLLC/CloudForge.git
   ```

## 🏗️ Development Workflow

### Creating a New Component

1. **Create Component Directory**

   ```bash
   mkdir src/your-service
   cd src/your-service
   ```

2. **Component Structure**

   ```
   src/your-service/
   ├── component.ts   # Main component function
   ├── types.ts       # TypeScript interfaces
   ├── iam.ts         # Optional IAM roles and policies
   ├── index.ts       # Public exports
   └── README.md      # Component documentation
   ```

   The `iam.ts` file is optional and should be used to define IAM roles and policies specific to the component when required.

3. **Example Component Files**

   **types.ts**

   ```typescript
   export interface YourServiceConfig {
     name: string
     environment: string
     // Add other required properties
   }
   ```

   **component.ts**

   ```typescript
   import { YourServiceConfig } from './types'

   export class AmplifyComponent extends ComponentResource {
     public readonly app: amplify.App
   public readonly branch: amplify.Branch
   ```

constructor(name: string, config: AmplifyAppConfig, opts?: ComponentResourceOptions) {
super('cloudforge:amplify:AmplifyComponent', name, {}, opts)
// Implementation
}

````

**index.ts**

```typescript
export * from './component'
export * from './types'
````

4. **Update Main Index**
   ```typescript
   // src/index.ts
   export * from './your-service'
   ```

### Code Quality Standards

- **TypeScript**: All code must be written in TypeScript with proper type definitions
- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Use Prettier for consistent code formatting
- **Naming**: Use descriptive names and follow existing patterns
- **Comments**: Add JSDoc comments for public APIs

### Testing Guidelines

1. **Manual Testing**

   - Test with both linking methods described above
   - Verify in multiple environments (dev, staging)
   - Test with different Pulumi stacks

2. **Integration Testing**
   - Create a simple test project in `examples/`
   - Ensure components work together
   - Test error scenarios

## 📝 Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**

```bash
git commit -m "feat: add ECS service factory"
git commit -m "fix: resolve S3 bucket naming issue"
git commit -m "docs: update amplify component README"
```

## 🔄 Pull Request Process

1. **Ensure Quality**

   ```bash
   yarn lint
   yarn format:check
   yarn build
   ```

2. **Test Thoroughly**

   - Test using both local linking and GitHub branch methods
   - Verify components work in isolation and together
   - Check for breaking changes

3. **Update Documentation**

   - Update component README if applicable
   - Update main README if adding new components
   - Add examples for new features

4. **Create Pull Request**

   - Use a descriptive title following conventional commits
   - Fill out the PR template completely
   - Link any related issues
   - Add screenshots or examples if applicable

5. **Review Process**
   - Address reviewer feedback promptly
   - Ensure CI checks pass
   - Squash commits if requested

## 🏷️ Versioning

CloudForge follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version: Breaking changes
- **MINOR** version: New features (backward compatible)
- **PATCH** version: Bug fixes (backward compatible)

## 🆘 Getting Help

- **Issues**: Check [existing issues](https://github.com/DopeTechLLC/CloudForge/issues) or create a new one
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Documentation**: Refer to component README files and main documentation

## 📋 Development Checklist

Before submitting your contribution:

- [ ] Code follows TypeScript and ESLint standards
- [ ] Changes are tested using local linking method
- [ ] Changes are tested using GitHub branch method
- [ ] Documentation is updated (if applicable)
- [ ] No breaking changes (or properly documented)
- [ ] Build passes (`yarn build`)
- [ ] Linting passes (`yarn lint`)
- [ ] Formatting is correct (`yarn format:check`)

## 🎯 Component Guidelines

When creating new components:

1. **Reusability**: Components should be generic and configurable
2. **Type Safety**: Provide comprehensive TypeScript interfaces
3. **Error Handling**: Include proper error handling and validation
4. **Documentation**: Each component needs clear documentation
5. **Consistency**: Follow existing patterns and naming conventions
6. **Platform Agnostic**: Avoid AWS-specific assumptions where possible

## 🚫 What Not to Include

- **Credentials**: Never commit AWS keys, secrets, or credentials
- **Environment-Specific**: Avoid hardcoded environment-specific values
- **Personal Config**: Don't include personal Pulumi stack configs
- **Large Files**: Avoid committing large binaries or dependencies

---

Thank you for contributing to 🌪️ CloudForge!
