import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'
import { Output } from '@pulumi/pulumi'

export interface EcsClusterConfig {
  name: string
}

export interface EcsServiceConfig {
  name: string
  image: Output<string> | string
  port: number
  cpu?: number
  memory?: number
  environment?: Record<string, string | Output<string>>
  desiredCount?: number
  enableLoadBalancer?: boolean
  secretName?: string | Output<string>
  sesIdentityEmail?: string
  bucketNames?: (string | Output<string>)[]
  dnsConfig: EcsDnsConfig
  healthCheckConfig: EcsHealthCheckConfig
}

export interface EcsDnsConfig {
  domainName: string
  zoneId: Output<string>
  apexDomain?: string
}

export interface EcsHealthCheckConfig {
  path: string
  interval?: number
  timeout?: number
}

export interface VpcConfig {
  vpc: awsx.ec2.Vpc
  vpcSecurityGroup: aws.ec2.SecurityGroup
}

export type EcsTaskRoleConfig = Pick<
  EcsServiceConfig,
  'secretName' | 'bucketNames' | 'sesIdentityEmail'
> & {
  name: string
}
