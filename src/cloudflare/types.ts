import { DnsRecord, GetZoneResult } from '@pulumi/cloudflare'
import { Input, Output } from '@pulumi/pulumi'

export interface CloudflareNameserverConfig {
  domain: string
  nameServers: Input<string[]>
  zoneId?: string
}

export interface CloudflareNameserverResources {
  nameserverRecords: Output<DnsRecord[]>
  zoneInfo?: Output<GetZoneResult>
}
