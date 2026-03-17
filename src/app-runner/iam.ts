import { iam } from '@pulumi/aws'
import { ComponentResource, Output } from '@pulumi/pulumi'

import { AppRunnerServiceArgs } from './types'

export function createAccessRole(
  name: string,
  tags: AppRunnerServiceArgs['tags'],
  parent: ComponentResource,
): Output<string> {
  const accessRole = new iam.Role(
    `${name}-apprunner-access`,
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
    `${name}-apprunner-access-policy`,
    {
      role: accessRole.id,
      policy: JSON.stringify(defaultEcrPolicy),
    },
    { parent },
  )

  return accessRole.arn
}
