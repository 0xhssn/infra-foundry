import { Output } from '@pulumi/pulumi'

import { EnvironmentVariablesType } from './environment'

export interface NameValuePair {
  name: string
  value: string | Output<string>
}

export function mapToNameValuePairs(map: EnvironmentVariablesType): NameValuePair[] {
  if (!Object.keys(map).length) return []

  return Object.entries(map).map(([name, value]) => ({ name, value }))
}
