import { Alias } from '@pulumi/pulumi'

/**
 * Type aliases for the vpc component, parameterised by a caller-defined
 * namespace prefix. Use when migrating an existing Pulumi project that
 * previously declared this component under a custom prefix.
 */
export const legacyAliases = (
  prefix: string,
): {
  vpc: Alias[]
} => ({
  vpc: [{ type: `${prefix}:vpc:Vpc` }],
})
