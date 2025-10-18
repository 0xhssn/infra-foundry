import { iam } from '@pulumi/aws'
import { Output, ComponentResource } from '@pulumi/pulumi'

import { AppRunnerServiceArgs } from './app-runner.types'

export function createAccessRole(
  img: AppRunnerServiceArgs['image'],
  cfgName: string,
  tags: AppRunnerServiceArgs['tags'],
  parent: ComponentResource,
): Output<string> {
  const accessRole = new iam.Role(
    `${cfgName}-apprunner-access`,
    {
      assumeRolePolicy: iam.assumeRolePolicyForPrincipal({
        Service: 'build.apprunner.amazonaws.com',
      }),
      tags,
    },
    { parent },
  )

  const defaultEcrPolicy = {
    Version: '2012-10-17',
    Statement: [
      { Action: ['ecr:GetAuthorizationToken'], Effect: 'Allow', Resource: '*' },
      {
        Action: [
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
          'ecr:GetRepositoryPolicy',
          'ecr:DescribeRepositories',
          'ecr:ListImages',
          'ecr:DescribeImages',
        ],
        Effect: 'Allow',
        Resource: '*',
      },
    ],
  }

  new iam.RolePolicy(
    `${cfgName}-apprunner-access-policy`,
    {
      role: accessRole.id,
      policy: img.ecrAccessPolicyJson ?? JSON.stringify(defaultEcrPolicy),
    },
    { parent },
  )

  return accessRole.arn
}

export function createInstanceRole(
  instanceRole: NonNullable<AppRunnerServiceArgs['instanceRole']>,
  cfgName: string,
  tags: AppRunnerServiceArgs['tags'],
  parent: ComponentResource,
): Output<string> {
  const newInstanceRole = new iam.Role(
    `${cfgName}-instance-role`,
    {
      assumeRolePolicy: iam.assumeRolePolicyForPrincipal({
        Service: 'tasks.apprunner.amazonaws.com',
      }),
      tags,
    },
    { parent },
  )

  if (instanceRole.attachPolicyArns) {
    for (const [i, arn] of instanceRole.attachPolicyArns.entries()) {
      new iam.RolePolicyAttachment(
        `${cfgName}-inst-attach-${i}`,
        {
          role: newInstanceRole.name,
          policyArn: arn,
        },
        { parent },
      )
    }
  }

  if (instanceRole.inlinePolicyJson) {
    new iam.RolePolicy(
      `${cfgName}-inst-inline`,
      {
        role: newInstanceRole.id,
        policy: instanceRole.inlinePolicyJson,
      },
      { parent },
    )
  }

  return newInstanceRole.arn
}
