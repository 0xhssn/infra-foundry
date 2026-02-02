import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'
import { output, all, ComponentResourceOptions, ComponentResource } from '@pulumi/pulumi'

import { addEnvSuffix } from '../utils/addEnvSuffix'
import { commonTags } from '../utils/commonTags'
import { context } from '../utils/context'

export class Vpc extends ComponentResource {
  public readonly vpc: awsx.ec2.Vpc
  public readonly vpceSg: aws.ec2.SecurityGroup
  public readonly ecrApiEndpoint: aws.ec2.VpcEndpoint
  public readonly ecrDkrEndpoint: aws.ec2.VpcEndpoint
  public readonly s3Endpoint: aws.ec2.VpcEndpoint
  public readonly logsEndpoint: aws.ec2.VpcEndpoint

  constructor(name: string, opts?: ComponentResourceOptions) {
    const resourceName = addEnvSuffix(name)
    super(
      'infra-foundary:vpc:Vpc',
      resourceName,
      {
        name: resourceName,
      },
      opts,
    )

    this.vpc = new awsx.ec2.Vpc(
      resourceName,
      {
        cidrBlock: '10.0.0.0/16',
        numberOfAvailabilityZones: 2,
        natGateways: { strategy: 'None' },
        enableDnsSupport: true,
        enableDnsHostnames: true,
        tags: commonTags,
      },
      { parent: this },
    )

    this.vpceSg = new aws.ec2.SecurityGroup(
      `${resourceName}-sg`,
      {
        vpcId: this.vpc.vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: commonTags,
      },
      { dependsOn: [this.vpc], parent: this },
    )

    this.ecrApiEndpoint = new aws.ec2.VpcEndpoint(
      `${resourceName}-ecr-api-endpoint`,
      {
        vpcId: this.vpc.vpc.id,
        serviceName: `com.amazonaws.${context.region}.ecr.api`,
        vpcEndpointType: 'Interface',
        subnetIds: this.vpc.privateSubnetIds,
        securityGroupIds: [this.vpceSg.id],
        privateDnsEnabled: true,
        tags: commonTags,
      },
      { parent: this },
    )

    this.ecrDkrEndpoint = new aws.ec2.VpcEndpoint(
      `${resourceName}-ecr-dkr-endpoint`,
      {
        vpcId: this.vpc.vpc.id,
        serviceName: `com.amazonaws.${context.region}.ecr.dkr`,
        vpcEndpointType: 'Interface',
        subnetIds: this.vpc.privateSubnetIds,
        securityGroupIds: [this.vpceSg.id],
        privateDnsEnabled: true,
        tags: commonTags,
      },
      { parent: this },
    )

    const privateRtIds = this.vpc.privateSubnetIds.apply((subnetIds) =>
      all(
        subnetIds.map((subnetId) =>
          output(
            aws.ec2
              .getRouteTable({
                filters: [{ name: 'association.subnet-id', values: [subnetId] }],
              })
              .then((rt) => rt.id),
          ),
        ),
      ),
    )

    this.s3Endpoint = new aws.ec2.VpcEndpoint(
      `${resourceName}-s3-endpoint`,
      {
        vpcId: this.vpc.vpc.id,
        serviceName: `com.amazonaws.${context.region}.s3`,
        vpcEndpointType: 'Gateway',
        routeTableIds: privateRtIds,
        tags: commonTags,
      },
      { dependsOn: [this.vpceSg], parent: this },
    )

    this.logsEndpoint = new aws.ec2.VpcEndpoint(
      `${resourceName}-logs-endpoint`,
      {
        vpcId: this.vpc.vpc.id,
        serviceName: `com.amazonaws.${context.region}.logs`,
        vpcEndpointType: 'Interface',
        subnetIds: this.vpc.privateSubnetIds,
        securityGroupIds: [this.vpceSg.id],
        privateDnsEnabled: true,
        tags: commonTags,
      },
      { parent: this },
    )

    this.registerOutputs({
      vpc: this.vpc,
      ecrApiEndpoint: this.ecrApiEndpoint,
      ecrDkrEndpoint: this.ecrDkrEndpoint,
      s3Endpoint: this.s3Endpoint,
      logsEndpoint: this.logsEndpoint,
    })
  }
}
