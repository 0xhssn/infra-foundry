import { Input } from '@pulumi/pulumi'

export interface VercelEnvVar {
  key: string
  value: Input<string>
  targets: Array<'production' | 'preview' | 'development'>
  sensitive?: boolean
}

export interface VercelProjectConfig {
  name: string
  framework?: string
  teamId?: string
  customDomain?: string
  gitRepo?: string
  environmentVariables?: VercelEnvVar[]
}
