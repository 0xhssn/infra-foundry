import { iam } from '@pulumi/aws'
import { Input } from '@pulumi/pulumi'

export type LambdaArchitecture = 'x86_64' | 'arm64'

export interface LambdaVpcConfig {
  subnetIds: Input<Input<string>[]>
  securityGroupIds: Input<Input<string>[]>
}

export interface LambdaFunctionConfig {
  name: string
  imageUri: Input<string>

  timeoutSeconds?: number
  memorySize?: number
  ephemeralStorageSize?: number
  architecture?: LambdaArchitecture
  reservedConcurrency?: number
  environment?: Record<string, Input<string>>
  logRetentionDays?: number

  vpcConfig?: LambdaVpcConfig
}

export interface LambdaExecutionRoleConfig {
  name: string
  hasVpcConfig?: boolean
}

export interface LambdaExecutionRole {
  role: iam.Role
  vpcAttachment?: iam.RolePolicyAttachment
}
