# Route53 Component

The Route53 component provides DNS hosting and record management for your domains.

## Features

- Create or find existing hosted zones
- Create DNS records (A, CNAME, TXT, etc.)
- Automatic zone creation
- Support for existing zones

## Usage

### Create Hosted Zone

```typescript
import { route53 } from 'infra-foundry'

const zone = route53.createHostedZone({
  name: 'example.com',
  comment: 'Main domain zone',
})

export const zoneId = zone.apply((z) => z.zone.zoneId)
export const nameServers = zone.apply((z) => z.zone.nameServers)
```

### Find Existing Hosted Zone

```typescript
import { route53 } from 'infra-foundry'

const zone = route53.createHostedZone({
  name: 'example.com',
  findExisting: true, // Look for existing zone first
})
```

### Create DNS Records

```typescript
import { route53 } from 'infra-foundry'
import * as pulumi from '@pulumi/pulumi'

const zone = route53.createHostedZone({ name: 'example.com' })

const records = route53.createDnsRecords({
  zoneId: zone.apply((z) => z.zone.zoneId),
  records: [
    {
      name: 'www.example.com',
      type: 'CNAME',
      value: 'example.com',
    },
    {
      name: 'api.example.com',
      type: 'A',
      value: loadBalancer.dnsName,
    },
  ],
})
```

## API Reference

### createHostedZone

Creates or finds a Route53 hosted zone.

**Parameters:**

| Property       | Type      | Required | Default | Description              |
| -------------- | --------- | -------- | ------- | ------------------------ |
| `name`         | `string`  | Yes      | -       | Domain name              |
| `comment`      | `string`  | No       | -       | Description for the zone |
| `findExisting` | `boolean` | No       | `false` | Look for existing zone   |

**Returns:** `FindOrCreateHostedZoneOutput`

### createDnsRecords

Creates DNS records in a hosted zone.

**Parameters:**

| Property  | Type             | Required | Description          |
| --------- | ---------------- | -------- | -------------------- |
| `zoneId`  | `Output<string>` | Yes      | Hosted zone ID       |
| `records` | `DnsRecord[]`    | Yes      | Array of DNS records |

**DnsRecord:**

| Property | Type                       | Description                           |
| -------- | -------------------------- | ------------------------------------- |
| `name`   | `string`                   | Record name (e.g., 'www.example.com') |
| `type`   | `string`                   | Record type (A, CNAME, TXT, etc.)     |
| `value`  | `string \| Output<string>` | Record value                          |

## Complete Example

```typescript
import * as pulumi from '@pulumi/pulumi'
import { route53, ecs, s3 } from 'infra-foundry'

// Create hosted zone
const zone = route53.createHostedZone({
  name: 'example.com',
  comment: 'Production domain',
})

// Create ECS service
const api = new ecs.EcsService({
  name: 'api',
  image: 'my-api:latest',
  port: 3000,
  dnsConfig: {
    domainName: 'api.example.com',
    zoneId: zone.apply((z) => z.zone.zoneId),
  },
  healthCheckConfig: {
    path: '/health',
  },
})

// Create S3 bucket with CloudFront
const assets = new s3.S3Bucket({
  name: 'assets',
})

// Create DNS records
const records = route53.createDnsRecords({
  zoneId: zone.apply((z) => z.zone.zoneId),
  records: [
    {
      name: 'cdn.example.com',
      type: 'CNAME',
      value: assets.assetsCdn.domainName,
    },
  ],
})

// Export name servers for domain registrar
export const nameServers = zone.apply((z) => z.zone.nameServers)
```

## Best Practices

1. **Name Servers**: Update your domain registrar with the Route53 name servers
2. **TTL Values**: Use appropriate TTL values (300s for frequently changing records)
3. **Health Checks**: Configure health checks for critical records
4. **Alias Records**: Use alias records for AWS resources (no charge)

## Related Components

- [ECS](./ecs.md) - Automatic DNS record creation for services
- [Amplify](./amplify.md) - Custom domain configuration
- [S3](./s3.md) - CloudFront domain mapping
