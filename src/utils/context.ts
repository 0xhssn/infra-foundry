import { getStack, getProject, Config } from '@pulumi/pulumi'

import { Environment } from './environment'

const config = new Config()

export interface Context {
  environment: Environment
  region: string
  project: string
  isProduction: boolean
}

// `region` is a getter so importing this module doesn't eagerly call
// `config.require('region')`. Consumers using only components that don't
// need a region (e.g. identity-center, organizations) shouldn't be forced
// to set <project>:region just to satisfy a side-effect on import.
export const context: Context = {
  environment: getStack() as Environment,
  get region() {
    return config.require('region')
  },
  project: getProject(),
  isProduction: getStack() === Environment.Prod,
}
