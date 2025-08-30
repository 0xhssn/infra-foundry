import { amplify } from '@pulumi/aws'
import { iam } from '@pulumi/aws'
import { Output } from '@pulumi/pulumi'

import { Environment, EnvironmentVariablesType } from '../utils/environment'

export interface AmplifyBranchConfig {
  branchName: string
  environment: Environment
  backendApiUrl: Output<string>
  environmentVariables?: EnvironmentVariablesType
  stage?: 'PRODUCTION' | 'DEVELOPMENT'
  enableAutoBuild?: boolean
}

export interface AmplifyAppConfig {
  appName: string
  repositoryUrl: string
  branches: AmplifyBranchConfig[]
  buildSpec?: string
  githubAccessToken: string
  defaultEnvironmentVariables?: EnvironmentVariablesType
}

export interface AmplifyDomainAssociationConfig {
  app: amplify.App
  appName: string
  domainName: string
  branches: amplify.Branch[]
  subdomainMapping?: Record<string, string> // Maps environment to subdomain prefix
}

export interface AmplifyDomainRolePolicy {
  amplifyDomainRole: iam.Role
  amplifyDomainPolicy: iam.Policy
}

export interface AmplifyCicdRolePolicy {
  amplifyCicdRole: iam.Role
  amplifyCicdPolicy: iam.Policy
}
