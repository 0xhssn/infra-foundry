import { getProject, getStack } from '@pulumi/pulumi'

/**
 * Build a Pulumi URN for a resource that previously had no parent (i.e. was
 * created at the stack root). Use as `aliases: [rootUrn(type, name)]` when
 * re-parenting a resource under a new ComponentResource without forcing a
 * replacement.
 */
export function rootUrn(type: string, name: string): string {
  return `urn:pulumi:${getStack()}::${getProject()}::${type}::${name}`
}
