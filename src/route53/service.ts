import { route53 } from '@pulumi/aws'
import { ComponentResource, Output, output } from '@pulumi/pulumi'

import { DnsRecord, GetHostedZoneOutput, HostedZoneOutput } from './types'

export function getHostedZone(name: string, privateZone: boolean = false): GetHostedZoneOutput {
  return output(route53.getZone({ name, privateZone }).catch(() => undefined))
}

export function getHostedZoneOrThrow(name: string, privateZone: boolean = false): HostedZoneOutput {
  return output(
    route53.getZone({ name, privateZone }).then((result) => {
      if (!result?.id) throw new Error(`Hosted zone ${name} not found`)
      return route53.Zone.get(name, result.id)
    }),
  )
}

export function createRoute53VerificationRecord(
  resourceName: string,
  verificationRecord: DnsRecord,
  zoneId: Output<string>,
  parent: ComponentResource,
): route53.Record {
  return new route53.Record(
    `${resourceName}-verification-record`,
    {
      zoneId: zoneId,
      name: verificationRecord.name,
      type: verificationRecord.type,
      records: [verificationRecord.value],
      ttl: 600,
    },
    { parent },
  )
}

export function createRoute53Record(
  resourceName: string,
  record: DnsRecord,
  zoneId: Output<string>,
  parent: ComponentResource,
  ttl?: number,
): route53.Record {
  return new route53.Record(
    resourceName,
    {
      zoneId: zoneId,
      name: record.name,
      type: record.type,
      records: [record.value],
      ttl: ttl || 600,
    },
    { parent },
  )
}

export function createRoute53AliasRecord(
  resourceName: string,
  domainName: string,
  loadBalancerDnsName: Output<string>,
  loadBalancerZoneId: Output<string>,
  zoneId: Output<string>,
  parent: ComponentResource,
  allowOverwrite?: boolean,
): route53.Record {
  return new route53.Record(
    `${resourceName}-alias`,
    {
      zoneId: zoneId,
      name: domainName,
      type: 'A',
      allowOverwrite,
      aliases: [
        {
          name: loadBalancerDnsName,
          zoneId: loadBalancerZoneId,
          evaluateTargetHealth: true,
        },
      ],
    },
    { parent },
  )
}

export function createRoute53CnameRecord(
  resourceName: string,
  fqdn: string,
  targetDnsName: Output<string>,
  hostedZoneId: Output<string>,
  parent: ComponentResource,
): route53.Record {
  return new route53.Record(
    `${resourceName}-cname`,
    {
      name: fqdn,
      type: 'CNAME',
      ttl: 300,
      records: [targetDnsName],
      zoneId: hostedZoneId,
    },
    { parent },
  )
}
