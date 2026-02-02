import { route53 } from '@pulumi/aws'
import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi'

import { CreateHostedZoneConfig } from './types'
import { commonTags } from '../utils/commonTags'

export class HostedZone extends ComponentResource {
  public readonly zone: route53.Zone

  constructor(name: string, config: CreateHostedZoneConfig, opts?: ComponentResourceOptions) {
    super('infra-foundary:route53:HostedZone', name, {}, opts)

    this.zone = this.createHostedZone(name, config)
    this.registerOutputs({
      zone: this.zone,
    })
  }

  private createHostedZone(resourceName: string, config: CreateHostedZoneConfig): route53.Zone {
    return new route53.Zone(
      resourceName,
      {
        name: config.name,
        comment: config.comment || `Hosted zone for ${config.name}`,
        tags: {
          ...commonTags,
          Component: 'Route53Zone',
        },
      },
      { parent: this },
    )
  }
}
