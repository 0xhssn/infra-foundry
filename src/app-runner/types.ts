import { Input } from '@pulumi/pulumi'

export interface AppRunnerServiceArgs {
  name: string
  image: Input<string>

  cpu?: 0.25 | 0.5 | 1 | 2 | 4
  memory?: 0.5 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 12

  port: string
  healthCheckPath: Input<string>

  env?: Record<string, Input<string>>
  secrets?: Record<string, Input<string>>

  instanceRole?: {
    attachPolicyArns?: Input<string>[]
    inlinePolicyJson?: Input<string>
  }

  autoscaling?: {
    minSize?: Input<number>
    maxSize?: Input<number>
    maxConcurrency?: Input<number>
  }

  vpc?: {
    subnetIds: Input<string>[]
    securityGroupIds: Input<string>[]
  }

  domainName?: string
  route53ZoneId?: Input<string>

  tags?: Record<string, Input<string>>
}
