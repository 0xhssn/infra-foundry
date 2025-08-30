import { Output } from '@pulumi/pulumi'

export type EnvVars = Record<string, string | Output<string>>

export interface NameValuePair {
  name: string
  value: string | Output<string>
}

export function mapToNameValuePairs(map: EnvVars): NameValuePair[] {
  if (!Object.keys(map).length) return []

  return Object.entries(map).map(([name, value]) => ({ name, value }))
}
