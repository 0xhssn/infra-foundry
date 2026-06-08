import * as aws from '@pulumi/aws'
import {
  ComponentResource,
  ComponentResourceOptions,
  Output,
  interpolate,
  output,
} from '@pulumi/pulumi'

import { IdentityCenterAdminConfig } from './types'
import { rootUrn } from '../utils/aliases'

/**
 * Provisions a single IAM Identity Center admin: user + AdministratorAccess
 * permission set + assignment of that user to the target AWS account.
 *
 * Prerequisite: IAM Identity Center must be enabled in the AWS console.
 * This component reads the existing instance via getInstances.
 */
export class IdentityCenterAdmin extends ComponentResource {
  public readonly instanceArn: Output<string>
  public readonly identityStoreId: Output<string>
  public readonly user: aws.identitystore.User
  public readonly permissionSet: aws.ssoadmin.PermissionSet
  public readonly accountAssignment: aws.ssoadmin.AccountAssignment
  public readonly userId: Output<string>
  public readonly ssoStartUrl: Output<string>
  public readonly targetAccountId: Output<string>

  constructor(name: string, config: IdentityCenterAdminConfig, opts?: ComponentResourceOptions) {
    super('infra-foundry:identity-center:IdentityCenterAdmin', name, {}, opts)

    const useLegacyAliases = config.legacyRootAliases ?? false

    const instance = aws.ssoadmin.getInstancesOutput()
    this.instanceArn = instance.arns.apply((a) => a[0])
    this.identityStoreId = instance.identityStoreIds.apply((i) => i[0])

    this.user = new aws.identitystore.User(
      'admin',
      {
        identityStoreId: this.identityStoreId,
        userName: config.adminUsername,
        displayName: `${config.adminGivenName} ${config.adminFamilyName}`,
        name: {
          givenName: config.adminGivenName,
          familyName: config.adminFamilyName,
        },
        emails: {
          value: config.adminEmail,
          type: 'work',
          primary: true,
        },
      },
      {
        parent: this,
        aliases: useLegacyAliases ? [rootUrn('aws:identitystore/user:User', 'admin')] : undefined,
      },
    )

    this.permissionSet = new aws.ssoadmin.PermissionSet(
      'administrator-access',
      {
        instanceArn: this.instanceArn,
        name: 'AdministratorAccess',
        description: 'Full admin on the management account',
        sessionDuration: 'PT4H',
      },
      {
        parent: this,
        aliases: useLegacyAliases
          ? [rootUrn('aws:ssoadmin/permissionSet:PermissionSet', 'administrator-access')]
          : undefined,
      },
    )

    new aws.ssoadmin.ManagedPolicyAttachment(
      'administrator-access-managed',
      {
        instanceArn: this.instanceArn,
        permissionSetArn: this.permissionSet.arn,
        managedPolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
      },
      {
        parent: this.permissionSet,
        aliases: useLegacyAliases
          ? [
              rootUrn(
                'aws:ssoadmin/managedPolicyAttachment:ManagedPolicyAttachment',
                'administrator-access-managed',
              ),
            ]
          : undefined,
      },
    )

    const caller = aws.getCallerIdentityOutput()
    this.targetAccountId = output(config.targetAccountId ?? caller.accountId)

    this.accountAssignment = new aws.ssoadmin.AccountAssignment(
      'admin-on-management',
      {
        instanceArn: this.instanceArn,
        permissionSetArn: this.permissionSet.arn,
        principalId: this.user.userId,
        principalType: 'USER',
        targetId: this.targetAccountId,
        targetType: 'AWS_ACCOUNT',
      },
      {
        parent: this,
        aliases: useLegacyAliases
          ? [rootUrn('aws:ssoadmin/accountAssignment:AccountAssignment', 'admin-on-management')]
          : undefined,
      },
    )

    this.userId = this.user.userId

    // SSO portal URL isn't returned by getInstances — derive the dual-stack
    // form from the instance ID (last segment of the ARN) + configured region.
    const instanceId = this.instanceArn.apply((arn) => arn.split('/').pop()!)
    this.ssoStartUrl = interpolate`https://${instanceId}.portal.sso.${config.awsRegion}.aws/start`

    this.registerOutputs({
      instanceArn: this.instanceArn,
      identityStoreId: this.identityStoreId,
      user: this.user,
      permissionSet: this.permissionSet,
      accountAssignment: this.accountAssignment,
      userId: this.userId,
      ssoStartUrl: this.ssoStartUrl,
      targetAccountId: this.targetAccountId,
    })
  }
}
