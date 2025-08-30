import { iam } from '@pulumi/aws'
import { ComponentResource } from '@pulumi/pulumi'

import { AmplifyDomainRolePolicy, AmplifyCicdRolePolicy } from './types'
import { commonTags } from '../utils/commonTags'

export function setupAmplifyDomainRole(
  environmentScopedName: string,
  parent: ComponentResource,
): AmplifyDomainRolePolicy {
  const amplifyDomainRole = new iam.Role(
    `${environmentScopedName}-amplify-domain-role`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'amplify.amazonaws.com',
            },
          },
        ],
      }),
      managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AmplifyBackendDeployFullAccess'],
      tags: {
        ...commonTags,
        Component: 'IAMRole',
      },
    },
    { parent },
  )

  const amplifyDomainPolicy = new iam.Policy(
    `${environmentScopedName}-amplify-domain-policy`,
    {
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
        ],
      }),
    },
    { parent },
  )

  new iam.RolePolicyAttachment(
    `${environmentScopedName}-amplify-domain-policy-attachment`,
    {
      role: amplifyDomainRole.name,
      policyArn: amplifyDomainPolicy.arn,
    },
    { parent: amplifyDomainRole },
  )

  return {
    amplifyDomainRole,
    amplifyDomainPolicy,
  }
}

export function setupAmplifyCicdPolicy(
  environmentScopedName: string,
  parent: ComponentResource,
): AmplifyCicdRolePolicy {
  const cicdRole = new iam.Role(
    `${environmentScopedName}-cicd-role`,
    {
      name: `${environmentScopedName}-cicd-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'amplify.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        ...commonTags,
        Component: 'IAM',
      },
    },
    { parent },
  )

  const amplifyPolicy = new iam.Policy(
    `${environmentScopedName}-amplify-policy`,
    {
      name: `${environmentScopedName}-amplify-policy`,
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
    },
    { parent },
  )

  new iam.RolePolicyAttachment(
    `${environmentScopedName}-amplify-policy-attachment`,
    {
      role: cicdRole.name,
      policyArn: amplifyPolicy.arn,
    },
    { parent: cicdRole },
  )

  return {
    amplifyCicdRole: cicdRole,
    amplifyCicdPolicy: amplifyPolicy,
  }
}
