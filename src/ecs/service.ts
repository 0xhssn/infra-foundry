import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'
import { ComponentResource, Output } from '@pulumi/pulumi'

import { EcsHealthCheckConfig } from './types'
import { commonTags } from '../utils/commonTags'

export function createCertificate(
  name: string,
  domainName: string,
  zoneId: Output<string>,
  parent: ComponentResource,
  altNames?: string[],
) {
  const cert = new aws.acm.Certificate(
    `${name}-cert`,
    {
      domainName,
      ...(altNames?.length ? { subjectAlternativeNames: altNames } : {}),
      validationMethod: 'DNS',
      tags: commonTags,
    },
    { parent },
  )

  const totalDomains = 1 + (altNames?.length || 0)
  const validationRecords: aws.route53.Record[] = []

  for (let i = 0; i < totalDomains; i++) {
    const validationRecord = new aws.route53.Record(
      `${name}-validation-record${i > 0 ? `-${i}` : ''}`,
      {
        name: cert.domainValidationOptions[i].resourceRecordName,
        type: cert.domainValidationOptions[i].resourceRecordType,
        records: [cert.domainValidationOptions[i].resourceRecordValue],
        ttl: 60,
        zoneId,
        allowOverwrite: true,
      },
      { parent },
    )

    validationRecords.push(validationRecord)
  }

  const certValidation = new aws.acm.CertificateValidation(
    `${name}-cert-validation`,
    {
      certificateArn: cert.arn,
      validationRecordFqdns: validationRecords.map((record) => record.fqdn),
    },
    { parent: cert },
  )

  return certValidation
}

export function createTargetGroup(
  name: string,
  port: number,
  vpcId: Output<string>,
  healthCheckConfig: EcsHealthCheckConfig,
  parent: ComponentResource,
) {
  return new aws.lb.TargetGroup(
    `${name}-tg`,
    {
      name: `${name}-tg`,
      port,
      protocol: 'HTTP',
      targetType: 'ip',
      vpcId,
      healthCheck: {
        path: healthCheckConfig.path,
        matcher: '200-399',
        interval: healthCheckConfig.interval || 30,
        timeout: healthCheckConfig.timeout || 15,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
      },
    },
    { parent },
  )
}

export function createLoadBalancer(
  name: string,
  vpc: awsx.ec2.Vpc,
  securityGroupId: Output<string>,
  parent: ComponentResource,
) {
  return new aws.lb.LoadBalancer(
    `${name}-lb`,
    {
      name: `${name}-lb`,
      internal: false,
      loadBalancerType: 'application',
      subnets: vpc.publicSubnetIds,
      securityGroups: [securityGroupId],
    },
    { parent },
  )
}

export function createLoadBalancerListener(
  name: string,
  loadBalancer: aws.lb.LoadBalancer,
  certValidation: aws.acm.CertificateValidation,
  targetGroup: aws.lb.TargetGroup,
  hostHeader: string,
  parent: ComponentResource,
  apexDomain?: string,
) {
  const listener = new aws.lb.Listener(
    `${name}-https-listener`,
    {
      loadBalancerArn: loadBalancer.arn,
      port: 443,
      protocol: 'HTTPS',
      sslPolicy: 'ELBSecurityPolicy-2016-08',
      certificateArn: certValidation.certificateArn,
      defaultActions: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    },
    { parent, dependsOn: [certValidation, loadBalancer] },
  )

  new aws.lb.ListenerRule(
    `${name}-host-header-rule`,
    {
      listenerArn: listener.arn,
      priority: 100,
      actions: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
      conditions: [
        {
          hostHeader: {
            values: [hostHeader],
          },
        },
      ],
    },
    { parent, dependsOn: [certValidation, loadBalancer] },
  )

  if (apexDomain) {
    new aws.lb.ListenerRule(
      `${name}-apex-host-header-rule`,
      {
        listenerArn: listener.arn,
        priority: 101,
        actions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        conditions: [
          {
            hostHeader: {
              values: [apexDomain],
            },
          },
        ],
      },
      { parent, dependsOn: [certValidation, loadBalancer] },
    )
  }

  return listener
}

export function createSecurityGroup(
  name: string,
  vpcId: Output<string>,
  { egress, ingress }: Pick<aws.ec2.SecurityGroupArgs, 'egress' | 'ingress'>,
  parent: ComponentResource,
) {
  return new aws.ec2.SecurityGroup(
    `${name}-sg`,
    {
      name: `${name}-sg`,
      vpcId,
      ingress,
      egress,
      tags: commonTags,
    },
    { parent },
  )
}

export function createSecurityGroups(
  resourceName: string,
  vpc: awsx.ec2.Vpc,
  configPort: number,
  parent: ComponentResource,
) {
  const securityGroup1 = createSecurityGroup(
    `${resourceName}-1`,
    vpc.vpc.id,
    {
      ingress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    },
    parent,
  )

  const securityGroup2 = createSecurityGroup(
    `${resourceName}-2`,
    vpc.vpc.id,
    {
      ingress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          securityGroups: [securityGroup1.id],
        },
        {
          fromPort: configPort,
          toPort: configPort,
          protocol: 'tcp',
          cidrBlocks: [vpc.vpc.cidrBlock],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    },
    parent,
  )

  return { securityGroup1, securityGroup2 }
}
