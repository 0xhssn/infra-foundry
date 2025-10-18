import { apprunner, types, route53 } from '@pulumi/aws'
import { ComponentResource, ComponentResourceOptions, Input, Output } from '@pulumi/pulumi'

import { createAccessRole, createInstanceRole } from './app-runner.iam'
import { AppRunnerServiceArgs } from './app-runner.types'

export class AppRunnerService extends ComponentResource {
  public readonly service: apprunner.Service
  public readonly serviceUrl: Output<string>
  public readonly serviceArn: Output<string>

  constructor(name: string, args: AppRunnerServiceArgs, opts?: ComponentResourceOptions) {
    super('cloudforge:AppRunner:Service', name, {}, opts)

    const cfgName = args.name ?? name

    let accessRoleArn: Input<string> | undefined = undefined
    if (args.image.type === 'ecr') {
      accessRoleArn = createAccessRole(args.image, cfgName, args.tags, this)
    }

    const instanceRoleArn = args.instanceRole
      ? createInstanceRole(args.instanceRole, cfgName, args.tags, this)
      : undefined

    const asc = new apprunner.AutoScalingConfigurationVersion(
      `${cfgName}-asc`,
      {
        autoScalingConfigurationName: `${cfgName}-asc`,
        maxConcurrency: args.autoscaling?.maxConcurrency ?? 100,
        maxSize: args.autoscaling?.maxSize ?? 3,
        minSize: args.autoscaling?.minSize ?? 1,
        tags: args.tags,
      },
      { parent: this },
    )

    let obsConfigArn: Input<string> | undefined = undefined
    if (args.enableLogs) {
      const obs = new apprunner.ObservabilityConfiguration(
        `${cfgName}-obs`,
        {
          observabilityConfigurationName: `${cfgName}-obs`,
          traceConfiguration: { vendor: 'AWSXRAY' },
          tags: args.tags,
        },
        { parent: this },
      )
      obsConfigArn = obs.arn
    }

    const runtimeEnvironmentVariables: Record<string, Input<string>> = {}
    const runtimeEnvironmentSecrets: Record<string, Input<string>> = {}

    if (args.env) {
      for (const [k, v] of Object.entries(args.env)) {
        runtimeEnvironmentVariables[k] = v
      }
    }
    if (args.secrets) {
      for (const [k, arn] of Object.entries(args.secrets)) {
        runtimeEnvironmentSecrets[k] = arn
      }
    }

    const healthCheck: types.input.apprunner.ServiceHealthCheckConfiguration = {
      protocol: 'HTTP',
      path: args.healthCheckPath,
      interval: 10,
      timeout: 5,
      healthyThreshold: 1,
      unhealthyThreshold: 3,
    }

    this.service = new apprunner.Service(
      `${cfgName}-svc`,
      {
        serviceName: cfgName,
        autoScalingConfigurationArn: asc.arn,
        healthCheckConfiguration: healthCheck,
        instanceConfiguration: {
          cpu: `${args.cpu ?? '0.5'} vCPU`,
          memory: `${args.memory ?? 1} GB`,
          instanceRoleArn,
        },
        observabilityConfiguration: obsConfigArn
          ? { observabilityEnabled: true, observabilityConfigurationArn: obsConfigArn }
          : { observabilityEnabled: false },
        sourceConfiguration: {
          authenticationConfiguration: accessRoleArn ? { accessRoleArn } : undefined,
          imageRepository: {
            imageIdentifier: args.image.imageIdentifier,
            imageRepositoryType: args.image.type === 'ecr' ? 'ECR' : 'ECR_PUBLIC',
            imageConfiguration: {
              port: args.port.toString(),
              runtimeEnvironmentVariables,
              runtimeEnvironmentSecrets,
            },
          },
          autoDeploymentsEnabled: args.image.type === 'ecr',
        },
        tags: args.tags,
      },
      { parent: this },
    )

    this.serviceArn = this.service.arn
    this.serviceUrl = this.service.serviceUrl

    if (args.domainName && args.route53ZoneId) {
      this.setupCustomDomain(args.domainName, args.route53ZoneId, cfgName, this.serviceArn)
    }

    this.registerOutputs({
      serviceArn: this.serviceArn,
      serviceUrl: this.serviceUrl,
    })
  }

  private setupCustomDomain(
    domain: NonNullable<AppRunnerServiceArgs['domainName']>,
    route53ZoneId: NonNullable<AppRunnerServiceArgs['route53ZoneId']>,
    cfgName: string,
    serviceArn: Output<string>,
  ) {
    const assoc = new apprunner.CustomDomainAssociation(
      `${cfgName}-domain`,
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
            `${cfgName}-val-${i}`,
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
      `${cfgName}-alias`,
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
