import { cloudwatch, iam, lambda } from '@pulumi/aws'
import { ComponentResource, ComponentResourceOptions, Output, Resource } from '@pulumi/pulumi'

import { createLambdaExecutionRole } from './iam'
import { LambdaFunctionConfig } from './types'
import { addEnvSuffix } from '../utils/addEnvSuffix'
import { commonTags } from '../utils/commonTags'

const DEFAULT_ARCHITECTURE = 'x86_64'

export class LambdaFunction extends ComponentResource {
  public readonly function: lambda.Function
  public readonly role: iam.Role
  public readonly logGroup?: cloudwatch.LogGroup
  public readonly arn: Output<string>
  public readonly name: Output<string>
  public readonly invokeArn: Output<string>

  constructor(config: LambdaFunctionConfig, opts?: ComponentResourceOptions) {
    const {
      name,
      imageUri,
      timeoutSeconds,
      memorySize,
      ephemeralStorageSize,
      architecture = DEFAULT_ARCHITECTURE,
      reservedConcurrency,
      environment,
      logRetentionDays,
      vpcConfig,
    } = config

    const resourceName = addEnvSuffix(name)
    super('infra-foundry:lambda:LambdaFunction', resourceName, {}, opts)

    const tags = { ...commonTags, Component: 'Lambda' }

    const { role, vpcAttachment } = createLambdaExecutionRole(
      {
        name: resourceName,
        hasVpcConfig: !!vpcConfig,
      },
      this,
    )
    this.role = role

    if (logRetentionDays !== undefined) {
      this.logGroup = new cloudwatch.LogGroup(
        `${resourceName}-logs`,
        {
          name: `/aws/lambda/${resourceName}`,
          retentionInDays: logRetentionDays,
          tags,
        },
        { parent: this },
      )
    }

    const functionDependsOn: Resource[] = []
    if (vpcAttachment) functionDependsOn.push(vpcAttachment)
    if (this.logGroup) functionDependsOn.push(this.logGroup)

    this.function = new lambda.Function(
      resourceName,
      {
        name: resourceName,
        packageType: 'Image',
        imageUri,
        role: this.role.arn,
        timeout: timeoutSeconds,
        memorySize,
        architectures: [architecture],
        reservedConcurrentExecutions: reservedConcurrency,
        ephemeralStorage: ephemeralStorageSize ? { size: ephemeralStorageSize } : undefined,
        environment: environment ? { variables: environment } : undefined,
        vpcConfig: vpcConfig
          ? {
              subnetIds: vpcConfig.subnetIds,
              securityGroupIds: vpcConfig.securityGroupIds,
            }
          : undefined,
        tags,
      },
      { parent: this, dependsOn: functionDependsOn.length ? functionDependsOn : undefined },
    )

    this.arn = this.function.arn
    this.name = this.function.name
    this.invokeArn = this.function.invokeArn

    this.registerOutputs({
      function: this.function,
      role: this.role,
      logGroup: this.logGroup,
      arn: this.arn,
      name: this.name,
      invokeArn: this.invokeArn,
    })
  }
}
