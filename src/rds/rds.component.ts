import { rds, ec2 } from '@pulumi/aws'
import { Output, ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi'

import { RdsComponentArgs } from './rds.types'

export class RdsComponent extends ComponentResource {
  public readonly dbInstance: rds.Instance
  public readonly endpoint: Output<string>
  public readonly address: Output<string>
  public readonly port: Output<number>

  constructor(name: string, args: RdsComponentArgs, opts?: ComponentResourceOptions) {
    super('infra-foundry:RDS:Instance', name, {}, opts)

    const securityGroup = this.createAllowAllSecurityGroup(name, args.tags || {})
    this.dbInstance = new rds.Instance(
      `${name}-instance`,
      {
        ...this.getDefaultArgs(args),
        ...args,
        vpcSecurityGroupIds: [securityGroup.id],
        identifier: `${name}-instance`,
      },
      { parent: this, ignoreChanges: ['identifier'] },
    )

    this.endpoint = this.dbInstance.endpoint
    this.address = this.dbInstance.address
    this.port = this.dbInstance.port

    this.registerOutputs({
      endpoint: this.endpoint,
      address: this.address,
      port: this.port,
    })
  }

  private getDefaultArgs(args: RdsComponentArgs): Required<{
    [K in
      | 'instanceClass'
      | 'allocatedStorage'
      | 'storageType'
      | 'backupRetentionPeriod'
      | 'backupWindow'
      | 'maintenanceWindow'
      | 'multiAz'
      | 'publiclyAccessible'
      | 'skipFinalSnapshot'
      | 'performanceInsightsEnabled']: NonNullable<RdsComponentArgs[K]>
  }> {
    return {
      instanceClass: args.instanceClass || 'db.t3.micro',
      allocatedStorage: args.allocatedStorage || 20,
      storageType: args.storageType || 'gp3',
      backupRetentionPeriod: args.backupRetentionPeriod || 7,
      backupWindow: args.backupWindow || '03:00-04:00',
      maintenanceWindow: args.maintenanceWindow || 'mon:04:00-mon:05:00',
      multiAz: args.multiAz || false,
      publiclyAccessible: args.publiclyAccessible || true,
      skipFinalSnapshot: args.skipFinalSnapshot || true,
      performanceInsightsEnabled: args.performanceInsightsEnabled || false,
    }
  }

  private createAllowAllSecurityGroup(
    name: string,
    tags: RdsComponentArgs['tags'],
  ): ec2.SecurityGroup {
    return new ec2.SecurityGroup(
      `${name}-sg`,
      {
        description: `Allow all inbound/outbound traffic for ${name} RDS`,
        ingress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            ipv6CidrBlocks: ['::/0'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            ipv6CidrBlocks: ['::/0'],
          },
        ],
        tags,
      },
      { parent: this },
    )
  }
}
