import { iam } from '@pulumi/aws'
import { ComponentResource } from '@pulumi/pulumi'

import { LambdaExecutionRole, LambdaExecutionRoleConfig } from './types'

export function createLambdaExecutionRole(
  { name, hasVpcConfig }: LambdaExecutionRoleConfig,
  parent: ComponentResource,
): LambdaExecutionRole {
  const role = new iam.Role(
    `${name}-execution-role`,
    {
      assumeRolePolicy: iam.assumeRolePolicyForPrincipal({
        Service: 'lambda.amazonaws.com',
      }),
      tags: { Name: `${name}-execution-role` },
    },
    { parent },
  )

  new iam.RolePolicyAttachment(
    `${name}-logs-attach`,
    {
      role,
      policyArn: iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
    },
    { parent },
  )

  let vpcAttachment: iam.RolePolicyAttachment | undefined
  if (hasVpcConfig) {
    vpcAttachment = new iam.RolePolicyAttachment(
      `${name}-vpc-attach`,
      {
        role,
        policyArn: iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole,
      },
      { parent },
    )
  }

  return { role, vpcAttachment }
}
