import { iam } from '@pulumi/aws'
import { ComponentResource, Output } from '@pulumi/pulumi'

export function attachSesPolicyToRole(
  name: string,
  role: iam.Role,
  accountId: Output<string>,
  sesIdentityEmail: string,
  parent: ComponentResource,
) {
  const sesPolicy = accountId.apply(
    (resolvedAccountId) =>
      new iam.Policy(
        `${name}-ses-policy`,
        {
          description: 'Allow ECS task to send emails using SES',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'ses:SendEmail',
                Resource: `arn:aws:ses:us-east-1:${resolvedAccountId}:identity/${sesIdentityEmail}`,
              },
            ],
          }),
        },
        { parent },
      ),
  )

  sesPolicy.apply((policy) => {
    new iam.RolePolicyAttachment(
      `${name}-ses-attach`,
      {
        role,
        policyArn: policy.arn,
      },
      { parent },
    )
  })

  return sesPolicy
}
