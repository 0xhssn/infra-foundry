import { iam } from '@pulumi/aws'
import { ComponentResource } from '@pulumi/pulumi'

import { commonTags } from '../utils/commonTags'

export function createAmplifyServiceRole(name: string, parent: ComponentResource) {
  const role = new iam.Role(
    `${name}-amplify-service-role`,
    {
      name: `${name}-amplify-service-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'amplify.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      managedPolicyArns: [iam.ManagedPolicy.AmplifyBackendDeployFullAccess],
      tags: { ...commonTags, Component: 'AmplifyServiceRole' },
    },
    { parent },
  )

  const domainsPolicy = new iam.Policy(
    `${name}-amplify-domains-policy`,
    {
      name: `${name}-amplify-domains-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'route53:ListHostedZones',
              'route53:GetHostedZone',
              'route53:ListResourceRecordSets',
              'route53:ChangeResourceRecordSets',
              'route53:GetChange',
              'route53:ListTagsForResource',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'acm:ListCertificates',
              'acm:RequestCertificate',
              'acm:DescribeCertificate',
              'acm:GetCertificate',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['cloudfront:CreateInvalidation'],
            Resource: '*',
          },
        ],
      }),
      tags: { ...commonTags, Component: 'AmplifyDomainsPolicy' },
    },
    { parent: role },
  )

  const amplifyPolicy = new iam.Policy(
    `${name}-amplify-policy`,
    {
      name: `${name}-amplify-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'amplify:StartJob',
              'amplify:StopJob',
              'amplify:GetApp',
              'amplify:UpdateApp',
              'amplify:GetBranch',
              'amplify:UpdateBranch',
              'amplify:GetJob',
              'amplify:CreateDeployment',
              'amplify:StartDeployment',
              'amplify:StopDeployment',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: { ...commonTags, Component: 'AmplifyPolicy' },
    },
    { parent },
  )

  new iam.RolePolicyAttachment(
    `${name}-amplify-domains-policy-attachment`,
    {
      role: role.name,
      policyArn: domainsPolicy.arn,
    },
    { parent: role },
  )

  new iam.RolePolicyAttachment(
    `${name}-amplify-policy-attachment`,
    {
      role: role.name,
      policyArn: amplifyPolicy.arn,
    },
    { parent: role },
  )

  return role
}
