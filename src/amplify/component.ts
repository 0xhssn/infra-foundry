import { amplify } from '@pulumi/aws'
import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi'

import { DEFAULT_BUILD_SPEC } from './constants'
import { setupAmplifyCicdPolicy, setupAmplifyDomainRole } from './iam'
import { AmplifyAppConfig, AmplifyDomainAssociationConfig } from './types'
import { addEnvSuffix } from '../utils/addEnvSuffix'
import { commonTags } from '../utils/commonTags'
import { context } from '../utils/context'

export class AmplifyApp extends ComponentResource {
  public readonly app: amplify.App
  public readonly branch: amplify.Branch

  constructor(name: string, config: AmplifyAppConfig, opts?: ComponentResourceOptions) {
    super('cloudforge:amplify:AmplifyApp', name, {}, opts)

    const envScopedName = addEnvSuffix(config.appName)
    const { amplifyDomainRole, amplifyDomainPolicy } = setupAmplifyDomainRole(envScopedName, this)
    const { amplifyCicdRole, amplifyCicdPolicy } = setupAmplifyCicdPolicy(envScopedName, this)

    this.app = new amplify.App(
      `${envScopedName}-app`,
      {
        name: envScopedName,
        repository: config.repositoryUrl,
        accessToken: config.githubAccessToken,
        buildSpec: config.buildSpec || DEFAULT_BUILD_SPEC,
        platform: 'WEB_COMPUTE',
        iamServiceRoleArn: amplifyDomainRole.arn,
        environmentVariables: {
          NODE_ENV: context.environment,
          AMPLIFY_DIFF_DEPLOY: 'false',
          NEXT_PUBLIC_API_URL: config.backendApiUrl,
          _LIVE_UPDATES:
            '[{"name":"Amplify CLI","pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]',
        },
        tags: {
          ...commonTags,
          Component: 'Amplify',
        },
      },
      {
        parent: this,
        dependsOn: [amplifyDomainRole, amplifyDomainPolicy],
      },
    )

    this.branch = new amplify.Branch(
      `${config.appName}-branch`,
      {
        appId: this.app.id,
        branchName: config.branchName,
        enableAutoBuild: true,
        framework: 'Next.js - SSR',
        stage: context.isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
        environmentVariables: {
          BACKEND_API_URL: config.backendApiUrl,
        },
        tags: {
          ...commonTags,
          Component: 'AmplifyBranch',
        },
      },
      {
        parent: this.app,
        dependsOn: [amplifyCicdRole, amplifyCicdPolicy, this.app],
      },
    )

    this.registerOutputs({
      app: this.app,
      branch: this.branch,
    })
  }

  public createDomainAssociation(
    config: AmplifyDomainAssociationConfig,
  ): amplify.DomainAssociation {
    const envScopedName = addEnvSuffix(config.appName)
    return new amplify.DomainAssociation(
      `${envScopedName}-domain`,
      {
        appId: this.app.id,
        domainName: config.domainName,
        subDomains: [
          {
            branchName: this.branch.branchName,
            prefix: '',
          },
        ],
        waitForVerification: false,
      },
      {
        parent: this.app,
        dependsOn: [this.app, this.branch],
      },
    )
  }
}
