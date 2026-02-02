import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'
import { ComponentResource, ComponentResourceOptions, Output } from '@pulumi/pulumi'

import { createEcsTaskRole } from './iam'
import {
  createCertificate,
  createTargetGroup,
  createLoadBalancer,
  createLoadBalancerListener,
  createSecurityGroups,
} from './service'
import { EcsServiceConfig, VpcConfig } from './types'
import { createRoute53AliasRecord } from '../route53/service'
import { addEnvSuffix } from '../utils/addEnvSuffix'
import { mapToNameValuePairs } from '../utils/environment'

export class EcsCluster extends ComponentResource {
  public readonly cluster: aws.ecs.Cluster

  constructor(name: string, opts?: ComponentResourceOptions) {
    const resourceName = addEnvSuffix(name)
    super(
      'infra-foundry:ecs:EcsCluster',
      resourceName,
      {
        name: resourceName,
      },
      opts,
    )

    this.cluster = new aws.ecs.Cluster(resourceName, { name: resourceName }, { parent: this })

    this.registerOutputs({
      cluster: this.cluster,
    })
  }
}

export class EcsService extends ComponentResource {
  public readonly service: awsx.ecs.FargateService
  public readonly url: Output<string>

  constructor(
    name: string,
    clusterComponent: EcsCluster,
    { dnsConfig, healthCheckConfig, ...config }: EcsServiceConfig,
    { vpc, vpcSecurityGroup }: VpcConfig,
    opts?: ComponentResourceOptions,
  ) {
    const resourceName = addEnvSuffix(name)
    super(
      'infra-foundry:ecs:EcsService',
      resourceName,
      {
        name: resourceName,
        parent: clusterComponent,
      },
      { ...opts },
    )

    const { securityGroup1, securityGroup2 } = createSecurityGroups(
      resourceName,
      vpc,
      config.port,
      this,
    )

    const _allowEcsToVpce = new aws.ec2.SecurityGroupRule(
      `${resourceName}-ecs-to-vpce`,
      {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        securityGroupId: vpcSecurityGroup.id,
        sourceSecurityGroupId: securityGroup2.id,
      },
      { parent: this },
    )

    const certDomains = dnsConfig.apexDomain ? [dnsConfig.apexDomain] : undefined

    const certValidation = createCertificate(
      resourceName,
      dnsConfig.domainName,
      dnsConfig.zoneId,
      this,
      certDomains,
    )
    const targetGroup = createTargetGroup(
      resourceName,
      config.port,
      vpc.vpc.id,
      healthCheckConfig,
      this,
    )
    const loadBalancer = createLoadBalancer(resourceName, vpc, securityGroup1.id, this)
    const _loadBalancerListener = createLoadBalancerListener(
      resourceName,
      loadBalancer,
      certValidation,
      targetGroup,
      dnsConfig.domainName,
      this,
      dnsConfig.apexDomain,
    )

    const _aliasRecord = createRoute53AliasRecord(
      resourceName,
      dnsConfig.domainName,
      loadBalancer.dnsName,
      loadBalancer.zoneId,
      dnsConfig.zoneId,
      this,
    )

    if (dnsConfig.apexDomain) {
      const _apexAliasRecord = createRoute53AliasRecord(
        `${resourceName}-apex`,
        dnsConfig.apexDomain,
        loadBalancer.dnsName,
        loadBalancer.zoneId,
        dnsConfig.zoneId,
        this,
      )
    }

    this.service = new awsx.ecs.FargateService(
      resourceName,
      {
        name,
        cluster: clusterComponent.cluster.arn,
        desiredCount: config.desiredCount || 1,
        taskDefinitionArgs: {
          taskRole: {
            roleArn: createEcsTaskRole(
              {
                name: resourceName,
                secretName: config.secretName,
                sesIdentityEmail: config.sesIdentityEmail,
                bucketNames: config.bucketNames,
              },
              this,
            ).arn,
          },
          container: {
            name,
            image: config.image,
            portMappings: [
              {
                containerPort: config.port,
              },
            ],
            environment: mapToNameValuePairs(config.environment ?? {}),
            essential: true,
          },
          cpu: (config.cpu || 256).toString(),
          memory: (config.memory || 512).toString(),
        },
        networkConfiguration: {
          subnets: vpc.publicSubnetIds,
          securityGroups: [securityGroup2.id],
          assignPublicIp: true,
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: name,
            containerPort: config.port,
          },
        ],
      },
      { parent: this, dependsOn: [certValidation, targetGroup, loadBalancer] },
    )

    this.url = loadBalancer.dnsName.apply((dns) => `https://${dns}`)

    this.registerOutputs({
      service: this.service,
      url: this.url,
    })
  }
}
