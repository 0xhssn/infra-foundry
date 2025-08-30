import { ses } from '@pulumi/aws'
import { Output, Resource } from '@pulumi/pulumi'

import { SesComponentArgs } from './types'
import { DnsRecord } from '../route53/types'
import { addEnvSuffix } from '../utils/addEnvSuffix'

export function createSESDomainIdentity(
  domainName: string,
  resourceName: string,
  parent: Resource,
): ses.DomainIdentity {
  return new ses.DomainIdentity(
    `${resourceName}-domain-identity`,
    { domain: domainName },
    { parent },
  )
}

export function createSESEmailIdentity(
  fromEmail: string,
  resourceName: string,
  parent: Resource,
): ses.EmailIdentity {
  return new ses.EmailIdentity(`${resourceName}-email-identity`, { email: fromEmail }, { parent })
}

export function createSESConfigurationSet(
  configurationSetName: string,
  args: SesComponentArgs,
  resourceName: string,
  parent: Resource,
): ses.ConfigurationSet {
  const configurationSet = new ses.ConfigurationSet(
    `${resourceName}-config-set`,
    { name: addEnvSuffix(configurationSetName) },
    { parent },
  )

  if (args.enableNotifications !== false) {
    createSESEventDestinations(args, resourceName, configurationSet, parent)
  }

  return configurationSet
}

export function setupDkimConfiguration(
  args: SesComponentArgs,
  domainIdentity: ses.DomainIdentity,
  resourceName: string,
  parent: Resource,
): {
  dkimTokens?: ses.DomainDkim
  dkimRecords?: Output<DnsRecord[]>
} {
  const dkimTokens = new ses.DomainDkim(
    `${resourceName}-dkim`,
    {
      domain: domainIdentity.domain,
    },
    { parent },
  )

  const dkimRecords = dkimTokens.dkimTokens.apply((tokens) =>
    tokens.map((token) => ({
      name: `${token}._domainkey.${args.domainName}`,
      value: `${token}.dkim.amazonses.com`,
      type: 'CNAME',
    })),
  )

  return { dkimTokens, dkimRecords }
}

function createSESEventDestinations(
  args: SesComponentArgs,
  resourceName: string,
  configurationSet: ses.ConfigurationSet,
  parent: Resource,
): void {
  if (args.bounceTopicArn) {
    new ses.EventDestination(
      `${resourceName}-bounce-destination`,
      {
        name: 'bounce-destination',
        configurationSetName: configurationSet.name,
        enabled: true,
        matchingTypes: ['bounce'],
        snsDestination: {
          topicArn: args.bounceTopicArn,
        },
      },
      { parent },
    )
  }

  if (args.complaintTopicArn) {
    new ses.EventDestination(
      `${resourceName}-complaint-destination`,
      {
        name: 'complaint-destination',
        configurationSetName: configurationSet.name,
        enabled: true,
        matchingTypes: ['complaint'],
        snsDestination: {
          topicArn: args.complaintTopicArn,
        },
      },
      { parent },
    )
  }
}
