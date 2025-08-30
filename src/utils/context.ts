import { getStack, getProject, Config } from '@pulumi/pulumi'

import { Environment } from './environment'

const config = new Config()

export interface Context {
  environment: Environment
  region: string
  project: string
  isProduction: boolean
}

export const context: Context = {
  environment: getStack() as Environment,
  region: config.require('region'),
  project: getProject(),
  isProduction: getStack() === Environment.Prod,
}
