import { Alias } from '@pulumi/pulumi'

/**
 * Type aliases for the secret component, parameterised by a
 * caller-defined namespace prefix. Use when migrating an existing Pulumi
 * project that previously declared this component under a custom prefix.
 *
 * Note: the registered resource type segment is `asm` (not `secret`) for
 * historical reasons — the URN reads `infra-foundry:asm:Secret`. The
 * alias below matches that segment.
 */
export const legacyAliases = (
  prefix: string,
): {
  secret: Alias[]
} => ({
  secret: [{ type: `${prefix}:asm:Secret` }],
})
