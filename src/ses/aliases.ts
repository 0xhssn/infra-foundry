import { Alias } from '@pulumi/pulumi'

/**
 * Type aliases for the ses components, parameterised by a caller-defined
 * namespace prefix. Use when migrating an existing Pulumi project that
 * previously declared these components under a custom prefix.
 */
export const legacyAliases = (
  prefix: string,
): {
  ses: Alias[]
  sesWithRoute53: Alias[]
} => ({
  ses: [{ type: `${prefix}:ses:Ses` }],
  sesWithRoute53: [{ type: `${prefix}:ses:SesWithRoute53` }],
})
