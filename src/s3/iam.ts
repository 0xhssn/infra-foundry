import { iam } from '@pulumi/aws'
import { output, Output, ComponentResource } from '@pulumi/pulumi'

export function attachS3PolicyToRole(
  name: string,
  role: iam.Role,
  bucketNames: (Output<string> | string)[],
  parent: ComponentResource,
) {
  const resolvedBucketNames = output(bucketNames)

  const s3Policy = resolvedBucketNames.apply((resolvedNames) => {
    const resources = resolvedNames.flatMap((name) => [
      `arn:aws:s3:::${name}`,
      `arn:aws:s3:::${name}/*`,
    ])

    return new iam.Policy(
      `${name}-s3access-policy`,
      {
        description: 'Allow ECS task to access S3 buckets',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:PutObject',
                's3:ListBucket',
                's3:DeleteObject',
                's3:PutObjectAcl',
                's3:PutObjectTagging',
              ],
              Resource: resources,
            },
          ],
        }),
      },
      { parent },
    )
  })

  s3Policy.apply((policy) => {
    new iam.RolePolicyAttachment(
      `${name}-s3access-attach`,
      {
        role,
        policyArn: policy.arn,
      },
      { parent },
    )
  })

  return s3Policy
}
