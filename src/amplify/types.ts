import { amplify } from '@pulumi/aws'
import { iam } from '@pulumi/aws'
import { Output } from '@pulumi/pulumi'

export interface AmplifyAppConfig {
  appName: string
  repositoryUrl: string
  branchName: string
  backendApiUrl: Output<string>
  buildSpec?: string
  githubAccessToken: string
}

export interface AmplifyDomainAssociationConfig {
  app: amplify.App
  appName: string
  domainName: string
  branch: amplify.Branch
}

export interface AmplifyDomainRolePolicy {
  amplifyDomainRole: iam.Role
  amplifyDomainPolicy: iam.Policy
}

export interface AmplifyCicdRolePolicy {
  amplifyCicdRole: iam.Role
  amplifyCicdPolicy: iam.Policy
}
