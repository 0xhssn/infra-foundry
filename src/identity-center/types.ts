import { Input } from '@pulumi/pulumi'

export interface IdentityCenterAdminConfig {
  adminUsername: string
  adminGivenName: string
  adminFamilyName: string
  adminEmail: Input<string>
  /** AWS region the Identity Center instance lives in (for deriving the portal URL). */
  awsRegion: Input<string>
  /** AWS account to grant AdministratorAccess on. Defaults to the calling account. */
  targetAccountId?: Input<string>
  /**
   * Opt in to URN aliases that preserve state from when these resources lived
   * at the project root (before being wrapped in this component). Set true
   * only when migrating an existing stack — never for new deployments.
   */
  legacyRootAliases?: boolean
}

/** Permission tiers a team member can be assigned. */
export type PermissionSetTier = 'AdministratorAccess' | 'PowerUserAccess'

export interface TeamMemberConfig {
  username: string
  givenName: string
  familyName: string
  email: Input<string>
  permissionSet: PermissionSetTier
}
