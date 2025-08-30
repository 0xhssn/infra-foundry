import { iam, getCallerIdentity } from '@pulumi/aws'
import { ComponentResource, output, Output } from '@pulumi/pulumi'

import { EcsTaskRoleConfig } from './types'
import { attachS3PolicyToRole } from '../s3/iam'
import { attachSecretsPolicyToRole } from '../secret/iam'
import { attachSesPolicyToRole } from '../ses/iam'

export function createEcsTaskRole(
  { name, secretName, bucketNames, sesIdentityEmail }: EcsTaskRoleConfig,
  parent: ComponentResource,
): iam.Role {
  const taskRole = new iam.Role(
    `${name}-task-role`,
    {
      assumeRolePolicy: iam.assumeRolePolicyForPrincipal({
        Service: 'ecs-tasks.amazonaws.com',
      }),
      tags: { Name: `${name}-task-role` },
    },
    { parent },
  )

  new iam.RolePolicyAttachment(
    `${name}-execution-attach`,
    {
      role: taskRole,
      policyArn: iam.ManagedPolicy.AmazonECSTaskExecutionRolePolicy,
    },
    { parent },
  )

  const accountId = output(getCallerIdentity()).apply((ci) => ci.accountId)
  if (secretName) attachSecretsPolicyToRole(name, taskRole, accountId, secretName, parent)
  if (bucketNames?.length)
    attachS3PolicyToRole(
      name,
      taskRole,
      bucketNames.filter((b): b is string | Output<string> => !!b),
      parent,
    )
  if (sesIdentityEmail) attachSesPolicyToRole(name, taskRole, accountId, sesIdentityEmail, parent)

  return taskRole
}
