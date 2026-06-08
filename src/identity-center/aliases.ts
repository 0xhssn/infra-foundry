import { Alias } from '@pulumi/pulumi'

/**
 * Type aliases for the three identity-center components, parameterised by a
 * caller-defined namespace prefix. Use when migrating an existing Pulumi
 * project that previously declared these components under a custom prefix
 * (e.g. `myorg:identity-center:IdentityCenterAdmin`) and you need to
 * preserve state through the rename to `infra-foundry:…`.
 */
export const legacyAliases = (
  prefix: string,
): {
  admin: Alias[]
  permissionSet: Alias[]
  teamMembers: Alias[]
} => ({
  admin: [{ type: `${prefix}:identity-center:IdentityCenterAdmin` }],
  permissionSet: [{ type: `${prefix}:identity-center:PermissionSet` }],
  teamMembers: [{ type: `${prefix}:identity-center:IdentityCenterTeamMembers` }],
})
