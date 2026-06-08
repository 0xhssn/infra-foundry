import * as aws from '@pulumi/aws'
import { ComponentResource, ComponentResourceOptions, Input, Output } from '@pulumi/pulumi'

export interface PermissionSetConfig {
  /** ARN of the IAM Identity Center instance the permission set belongs to. */
  instanceArn: Input<string>
  /** Name shown in the AWS console (conventionally matches the managed policy name). */
  name: string
  description: string
  /** ARN of an AWS-managed IAM policy to attach. */
  managedPolicyArn: string
  /** SSO session length. Default 4 hours. */
  sessionDuration?: string
}

/**
 * A permission set in IAM Identity Center: an SSO-attachable role definition
 * backed by a single AWS-managed policy. Wraps the permission-set resource
 * plus its managed-policy attachment so consumers get one logical unit.
 */
export class PermissionSet extends ComponentResource {
  public readonly arn: Output<string>
  public readonly permissionSet: aws.ssoadmin.PermissionSet

  constructor(name: string, config: PermissionSetConfig, opts?: ComponentResourceOptions) {
    super('infra-foundry:identity-center:PermissionSet', name, {}, opts)

    this.permissionSet = new aws.ssoadmin.PermissionSet(
      'permission-set',
      {
        instanceArn: config.instanceArn,
        name: config.name,
        description: config.description,
        sessionDuration: config.sessionDuration ?? 'PT4H',
      },
      { parent: this },
    )

    new aws.ssoadmin.ManagedPolicyAttachment(
      'managed',
      {
        instanceArn: config.instanceArn,
        permissionSetArn: this.permissionSet.arn,
        managedPolicyArn: config.managedPolicyArn,
      },
      { parent: this.permissionSet },
    )

    this.arn = this.permissionSet.arn

    this.registerOutputs({
      arn: this.arn,
      permissionSet: this.permissionSet,
    })
  }
}
