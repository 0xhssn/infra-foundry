import type { DnsRecord, GetZoneResult } from '@pulumi/cloudflare'
import { Input, Output, output, ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi'

import { CloudflareNameserverResources } from './types'
import { CloudflareNameserverConfig } from './types'
import { getBaseDomain, getSubdomain, sanitizeDomainForResourceName } from '../utils/domain'

type CloudflareSdk = typeof import('@pulumi/cloudflare')

// `@pulumi/cloudflare` is an optional peer. Load it lazily so consumers
// that don't use this component aren't forced to install it; the require
// only happens on first instantiation, and a missing peer surfaces as a
// helpful construction-time error instead of a load-time crash.
let cachedSdk: CloudflareSdk | null | undefined
function loadCloudflareSdk(): CloudflareSdk {
  if (cachedSdk === undefined) {
    try {
      cachedSdk = require('@pulumi/cloudflare') as CloudflareSdk
    } catch {
      cachedSdk = null
    }
  }
  if (!cachedSdk) {
    throw new Error(
      'CloudflareNameserver requires the optional peer @pulumi/cloudflare. ' +
        'Install it with `npm install @pulumi/cloudflare` or `yarn add @pulumi/cloudflare`.',
    )
  }
  return cachedSdk
}

export class CloudflareNameserver extends ComponentResource {
  public readonly nameserverRecords: Output<DnsRecord[]>
  public readonly zoneInfo: Output<GetZoneResult> | undefined
  private readonly cloudflare: CloudflareSdk

  constructor(name: string, config: CloudflareNameserverConfig, opts?: ComponentResourceOptions) {
    super('infra-foundry:cloudflare:CloudflareNameserver', name, {}, opts)

    this.cloudflare = loadCloudflareSdk()

    const res = !config.zoneId
      ? this._createNsRecordsOnCloudflare(config)
      : this._createNsRecordsOnCloudflareWithZoneId(config.zoneId, config)
    this.nameserverRecords = res.nameserverRecords
    this.zoneInfo = res.zoneInfo

    this.registerOutputs({
      nameserverRecords: this.nameserverRecords,
      zoneInfo: this.zoneInfo,
    })
  }

  private _createNsRecordsOnCloudflare({
    nameServers,
    domain,
  }: CloudflareNameserverConfig): CloudflareNameserverResources {
    const baseDomain = getBaseDomain(domain)
    const subdomain = getSubdomain(domain)

    const zone = this.cloudflare.getZone({ filter: { name: baseDomain } })
    if (!zone) throw new Error(`Zone ${baseDomain} not found`)

    const nameserverRecords = this._createNameserverRecords(
      nameServers,
      subdomain,
      domain,
      zone.then((z) => z.zoneId!),
    )

    return {
      nameserverRecords,
      zoneInfo: output(zone),
    }
  }

  private _createNsRecordsOnCloudflareWithZoneId(
    zoneId: string,
    { nameServers, domain }: CloudflareNameserverConfig,
  ): CloudflareNameserverResources {
    const subdomain = getSubdomain(domain)

    return {
      nameserverRecords: this._createNameserverRecords(nameServers, subdomain, domain, zoneId),
    }
  }

  private _createNameserverRecords(
    nameServers: Input<string[]>,
    subdomain: string,
    domain: string,
    zoneId: Input<string>,
  ): Output<DnsRecord[]> {
    const Cloudflare = this.cloudflare
    return output(nameServers).apply((resolvedNameServers) => {
      return resolvedNameServers.map((nameServer, recordIndex) => {
        return new Cloudflare.DnsRecord(
          `${sanitizeDomainForResourceName(subdomain)}-route53-ns-${recordIndex}`,
          {
            zoneId,
            name: subdomain,
            type: 'NS',
            content: nameServer,
            ttl: 300,
            comment: `Delegate ${domain} to AWS Route53`,
          },
          { parent: this },
        )
      })
    })
  }
}
