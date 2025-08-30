import { iam } from '@pulumi/aws'
import { ComponentResource, Output, all } from '@pulumi/pulumi'

export function attachSecretsPolicyToRole(
  name: string,
  taskRole: iam.Role,
  accountId: Output<string>,
  secretName: Output<string> | string,
  parent: ComponentResource,
) {
  const getSecretsPolicy = all([accountId, secretName]).apply(
    ([resolvedAccountId, resolvedSecretName]) =>
      new iam.Policy(
        `${name}-getsecrets-policy`,
        {
          description: 'Allow ECS tasks to read correct Secrets Manager secret in this account',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['secretsmanager:GetSecretValue'],
                Resource: `arn:aws:secretsmanager:*:${resolvedAccountId}:secret:${resolvedSecretName}*`,
              },
            ],
          }),
        },
        { parent },
      ),
  )

  getSecretsPolicy.apply((policy) => {
    new iam.RolePolicyAttachment(
      `${name}-getsecrets-attach`,
      {
        role: taskRole,
        policyArn: policy.arn,
      },
      { parent },
    )
  })

  return getSecretsPolicy
}
