import * as aws from '@pulumi/aws'
import { ComponentResource, ComponentResourceOptions, Input, Output, all } from '@pulumi/pulumi'

import { PermissionSetTier, TeamMemberConfig } from './types'

export interface IdentityCenterTeamMembersConfig {
  identityStoreId: Input<string>
  instanceArn: Input<string>
  /** Map of tier name → permission set ARN. Each member references one by name. */
  permissionSets: Record<PermissionSetTier, Input<string>>
  targetAccountId: Input<string>
  members: TeamMemberConfig[]
}

/**
 * Provisions additional Identity Center users beyond the admin and assigns
 * them to the target AWS account under the permission set tier each member
 * requested.
 *
 * Permission sets themselves are provisioned upstream and passed in by ARN —
 * this component just looks up the right one per member.
 */
export class IdentityCenterTeamMembers extends ComponentResource {
  public readonly users: Record<string, aws.identitystore.User>
  public readonly assignments: Record<string, aws.ssoadmin.AccountAssignment>
  public readonly userIds: Output<Record<string, string>>

  constructor(
    name: string,
    config: IdentityCenterTeamMembersConfig,
    opts?: ComponentResourceOptions,
  ) {
    super('infra-foundry:identity-center:IdentityCenterTeamMembers', name, {}, opts)

    this.users = {}
    this.assignments = {}

    for (const member of config.members) {
      const user = new aws.identitystore.User(
        member.username,
        {
          identityStoreId: config.identityStoreId,
          userName: member.username,
          displayName: `${member.givenName} ${member.familyName}`,
          name: {
            givenName: member.givenName,
            familyName: member.familyName,
          },
          emails: {
            value: member.email,
            type: 'work',
            primary: true,
          },
        },
        { parent: this },
      )

      const assignment = new aws.ssoadmin.AccountAssignment(
        `${member.username}-assignment`,
        {
          instanceArn: config.instanceArn,
          permissionSetArn: config.permissionSets[member.permissionSet],
          principalId: user.userId,
          principalType: 'USER',
          targetId: config.targetAccountId,
          targetType: 'AWS_ACCOUNT',
        },
        { parent: this },
      )

      this.users[member.username] = user
      this.assignments[member.username] = assignment
    }

    const userIdEntries = Object.entries(this.users).map(([username, user]) =>
      user.userId.apply((id) => [username, id] as const),
    )
    this.userIds = all(userIdEntries).apply((entries) => Object.fromEntries(entries))

    this.registerOutputs({
      users: this.users,
      assignments: this.assignments,
      userIds: this.userIds,
    })
  }
}
