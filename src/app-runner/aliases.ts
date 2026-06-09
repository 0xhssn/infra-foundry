import { Alias } from '@pulumi/pulumi'

/**
 * Type aliases for the app-runner component, parameterised by a
 * caller-defined namespace prefix. Use when migrating an existing Pulumi
 * project that previously declared this component under a custom prefix.
 */
export const legacyAliases = (
  prefix: string,
): {
  service: Alias[]
} => ({
  service: [{ type: `${prefix}:app-runner:AppRunnerService` }],
})
