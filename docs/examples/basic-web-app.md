# Example: Basic Web Application

This example demonstrates deploying a simple static website using S3 and CloudFront.

## Overview

We'll create:

- S3 bucket for static assets
- CloudFront distribution for global CDN
- Simple HTML website

## Prerequisites

- Pulumi CLI installed
- AWS credentials configured
- Node.js >= 20.0.0

## Project Structure

```
my-website/
├── index.ts          # Pulumi infrastructure code
├── package.json
├── Pulumi.yaml
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

## Step 1: Initialize Project

```bash
mkdir my-website && cd my-website
pulumi new typescript
npm install infra-foundry @pulumi/aws @pulumi/pulumi
```

## Step 2: Create Infrastructure Code

Edit `index.ts`:

```typescript
import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import { s3 } from 'infra-foundry'

// Create S3 bucket with CloudFront
const website = new s3.S3Bucket({
  name: 'my-website',
})

// Upload website files
const indexHtml = new aws.s3.BucketObject('index.html', {
  bucket: website.assetBucket.id,
  key: 'index.html',
  source: new pulumi.asset.FileAsset('./public/index.html'),
  contentType: 'text/html',
})

const stylesCss = new aws.s3.BucketObject('styles.css', {
  bucket: website.assetBucket.id,
  key: 'styles.css',
  source: new pulumi.asset.FileAsset('./public/styles.css'),
  contentType: 'text/css',
})

const appJs = new aws.s3.BucketObject('app.js', {
  bucket: website.assetBucket.id,
  key: 'app.js',
  source: new pulumi.asset.FileAsset('./public/app.js'),
  contentType: 'application/javascript',
})

// Export the website URL
export const websiteUrl = pulumi.interpolate`https://${website.assetsCdn.domainName}`
export const bucketName = website.assetBucket.id
```

## Step 3: Create Website Files

Create `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Website</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="container">
      <h1>Welcome to My Website</h1>
      <p>Deployed with Infra Foundry and Pulumi!</p>
    </div>
    <script src="app.js"></script>
  </body>
</html>
```

Create `public/styles.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: white;
  padding: 3rem;
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 1rem;
}

p {
  color: #666;
  font-size: 1.1rem;
}
```

Create `public/app.js`:

```javascript
console.log('Website loaded successfully!')
```

## Step 4: Deploy

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# Get the website URL
pulumi stack output websiteUrl
```

## Step 5: Visit Your Website

Open the URL from the output in your browser:

```bash
open $(pulumi stack output websiteUrl)
```

## Updating Content

To update your website:

1. Modify files in `public/`
2. Run `pulumi up`
3. Invalidate CloudFront cache (optional for immediate updates):

```bash
aws cloudfront create-invalidation \
  --distribution-id $(pulumi stack output cdnDistributionId) \
  --paths "/*"
```

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Next Steps

- Add a custom domain with [Route53](./static-site.md)
- Use [Amplify](./static-site.md) for automatic deployments from Git
- Add more pages and assets
- Implement a build process (webpack, vite, etc.)

## Cost Estimate

- S3 storage: ~$0.023/GB/month
- CloudFront: Free tier includes 1TB data transfer
- Total: ~$1-5/month for a small website
