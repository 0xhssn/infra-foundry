import { Input } from '@pulumi/pulumi'

export interface VercelEnvVar {
  key: string
  value: Input<string>
  targets: Array<'production' | 'preview' | 'development'>
  sensitive?: boolean
}

export interface VercelGitCommentsConfig {
  onCommit: boolean
  onPullRequest: boolean
}

export interface VercelProjectConfig {
  name: string
  framework?: string
  teamId?: string
  customDomain?: string
  gitRepo?: string
  gitRepoType?: 'github' | 'gitlab' | 'bitbucket'
  productionBranch?: string
  rootDirectory?: string
  buildCommand?: Input<string>
  installCommand?: Input<string>
  outputDirectory?: Input<string>
  nodeVersion?: Input<string>
  gitComments?: VercelGitCommentsConfig
  previewComments?: boolean
  ignoreCommand?: Input<string>
  environmentVariables?: VercelEnvVar[]
}
