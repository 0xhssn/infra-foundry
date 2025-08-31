import { iam } from '@pulumi/aws'

import { EnvironmentVariablesType } from '../utils/environment'

export interface AmplifyAppConfig {
  name: string
  appRoot?: string
  repository: string

  branchName: string
  domainName?: string

  githubAccessToken: string
  environmentVariables?: EnvironmentVariablesType
}

export interface AmplifyDomainAssociationConfig {
  domainName: string
}

export interface AmplifyDomainRolePolicy {
  amplifyDomainRole: iam.Role
  amplifyDomainPolicy: iam.Policy
}

export interface AmplifyCicdRolePolicy {
  amplifyCicdRole: iam.Role
  amplifyCicdPolicy: iam.Policy
}
