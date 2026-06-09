import { Alias } from '@pulumi/pulumi'

/**
 * Type aliases for the ecs components, parameterised by a caller-defined
 * namespace prefix. Use when migrating an existing Pulumi project that
 * previously declared these components under a custom prefix.
 */
export const legacyAliases = (
  prefix: string,
): {
  cluster: Alias[]
  service: Alias[]
} => ({
  cluster: [{ type: `${prefix}:ecs:EcsCluster` }],
  service: [{ type: `${prefix}:ecs:EcsService` }],
})
