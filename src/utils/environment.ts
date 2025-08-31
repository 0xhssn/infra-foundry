import { Output } from '@pulumi/pulumi'

export enum Environment {
  Global = 'global',
  Dev = 'dev',
  QA = 'qa',
  Prod = 'prod',
  Staging = 'staging',
}

export const EnvironmentValues = Object.values(Environment)

export type MaybePulumiOutput<T> = T | Output<T>

export type EnvironmentVariablesType = Record<string, MaybePulumiOutput<string>>
export interface NameValuePair {
  name: string
  value: MaybePulumiOutput<string>
}

export function mapToNameValuePairs(map: EnvironmentVariablesType): NameValuePair[] {
  if (!Object.keys(map).length) return []

  return Object.entries(map).map(([name, value]) => ({ name, value }))
}
