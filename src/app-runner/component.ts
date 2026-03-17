import { apprunner, route53 } from '@pulumi/aws'
import { ComponentResource, ComponentResourceOptions, Output } from '@pulumi/pulumi'

import { createAccessRole } from './iam'
import { AppRunnerServiceArgs } from './types'

export class AppRunnerService extends ComponentResource {
  public readonly service: apprunner.Service
  public readonly serviceUrl: Output<string>
  public readonly serviceArn: Output<string>

  constructor(
    { name, env = {}, secrets = {}, port, tags, ...args }: AppRunnerServiceArgs,
    opts?: ComponentResourceOptions,
  ) {
    super('infra-foundry:app-runner:AppRunnerService', name, {}, opts)

    const asc = new apprunner.AutoScalingConfigurationVersion(
      `${name}-asc`,
      {
        autoScalingConfigurationName: `${name}-asc`,
        maxConcurrency: args.autoscaling?.maxConcurrency ?? 100,
        maxSize: args.autoscaling?.maxSize ?? 3,
        minSize: args.autoscaling?.minSize ?? 1,
        tags,
      },
      { parent: this },
    )

    this.service = new apprunner.Service(
      `${name}-svc`,
      {
        serviceName: name,
        autoScalingConfigurationArn: asc.arn,
        healthCheckConfiguration: this.buildHealthCheckConfig(args.healthCheckPath),
        instanceConfiguration: {
          cpu: `${args.cpu ?? '0.5'} vCPU`,
          memory: `${args.memory ?? 1} GB`,
        },
        observabilityConfiguration: { observabilityEnabled: false },
        sourceConfiguration: {
          authenticationConfiguration: { accessRoleArn: createAccessRole(name, tags, this) },
          imageRepository: {
            imageIdentifier: args.image,
            imageRepositoryType: 'ECR',
            imageConfiguration: {
              port,
              runtimeEnvironmentVariables: env,
              runtimeEnvironmentSecrets: secrets,
            },
          },
        },
        tags,
      },
      { parent: this },
    )

    this.serviceArn = this.service.arn
    this.serviceUrl = this.service.serviceUrl

    if (args.domainName && args.route53ZoneId) {
      this.setupCustomDomain(args.domainName, args.route53ZoneId, name, this.serviceArn)
    }

    this.registerOutputs({
      serviceArn: this.serviceArn,
      serviceUrl: this.serviceUrl,
    })
  }

  private buildHealthCheckConfig(path: NonNullable<AppRunnerServiceArgs['healthCheckPath']>) {
    return {
      path,
      timeout: 10,
      interval: 10,
      protocol: 'HTTP',
      healthyThreshold: 1,
      unhealthyThreshold: 1,
    }
  }

  private setupCustomDomain(
    domain: NonNullable<AppRunnerServiceArgs['domainName']>,
    route53ZoneId: NonNullable<AppRunnerServiceArgs['route53ZoneId']>,
    name: string,
    serviceArn: Output<string>,
  ) {
    const assoc = new apprunner.CustomDomainAssociation(
      `${name}-domain`,
      {
        domainName: domain,
        serviceArn,
      },
      { parent: this },
    )

    assoc.certificateValidationRecords.apply((recs) => {
      return recs.map(
        (r, i) =>
          new route53.Record(
            `${name}-val-${i}`,
            {
              name: r.name,
              type: r.type,
              zoneId: route53ZoneId,
              records: [r.value],
              ttl: 60,
            },
            { parent: assoc },
          ),
      )
    })

    new route53.Record(
      `${name}-alias`,
      {
        name: domain,
        type: 'CNAME',
        zoneId: route53ZoneId,
        records: [this.serviceUrl],
        ttl: 60,
      },
      { parent: assoc },
    )
  }
}
