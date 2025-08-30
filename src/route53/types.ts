import { route53 } from '@pulumi/aws'
import { Output } from '@pulumi/pulumi'

export interface CreateHostedZoneConfig {
  name: string
  comment?: string
  findExisting?: boolean
}

export type HostedZoneOutput = Output<route53.Zone>
export type GetHostedZoneOutput = Output<route53.GetZoneResult | undefined>
export type FindOrCreateHostedZoneOutput = Output<{ zone: Output<route53.Zone>; created: boolean }>

export type DnsRecord = {
  name: string
  value: Output<string> | string
  type: string
}
