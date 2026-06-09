import { Alias } from '@pulumi/pulumi'

/**
 * Type aliases for the s3 component, parameterised by a caller-defined
 * namespace prefix. Use when migrating an existing Pulumi project that
 * previously declared this component under a custom prefix.
 */
export const legacyAliases = (
  prefix: string,
): {
  bucket: Alias[]
} => ({
  bucket: [{ type: `${prefix}:s3:S3Bucket` }],
})
