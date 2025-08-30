import { DnsRecord, getZone, GetZoneResult } from '@pulumi/cloudflare'
import { Input, Output, output, ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi'

import { CloudflareNameserverResources } from './types'
import { CloudflareNameserverConfig } from './types'
import { getBaseDomain, getSubdomain, sanitizeDomainForResourceName } from '../utils/domain'

export class CloudflareNameserver extends ComponentResource {
  public readonly nameserverRecords: Output<DnsRecord[]>
  public readonly zoneInfo: Output<GetZoneResult> | undefined

  constructor(name: string, config: CloudflareNameserverConfig, opts?: ComponentResourceOptions) {
    super('cloudforge:cloudflare:CloudflareNameserver', name, {}, opts)

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

    const zone = getZone({ filter: { name: baseDomain } })
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
    return output(nameServers).apply((resolvedNameServers) => {
      return resolvedNameServers.map((nameServer, recordIndex) => {
        return new DnsRecord(
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
