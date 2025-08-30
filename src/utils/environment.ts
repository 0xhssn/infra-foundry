import { Output } from "@pulumi/pulumi"

export enum Environment {
  Global = 'global',
  Dev = 'dev',
  QA = 'qa',
  Prod = 'prod',
  Staging = 'staging',
}

export const EnvironmentValues = Object.values(Environment)

export type EnvironmentVariablesType = Record<string, string | Output<string>>