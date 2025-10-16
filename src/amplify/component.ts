import { amplify } from '@pulumi/aws'
import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi'

import { createMonorepoBuildSpec } from './constants'
import { createAmplifyServiceRole } from './iam'
import { AmplifyAppConfig, AmplifyDomainAssociationConfig } from './types'
import { commonTags } from '../utils/commonTags'
import { context } from '../utils/context'

export class AmplifyApp extends ComponentResource {
  public readonly app: amplify.App
  public branch: amplify.Branch
  public domainAssociation?: amplify.DomainAssociation

  constructor(
    {
      name,
      repository,
      githubAccessToken,
      appRoot = '.',
      branchName,
      domainName,
      environmentVariables,
    }: AmplifyAppConfig,
    opts?: ComponentResourceOptions,
  ) {
    super('cloudforge:amplify:AmplifyApp', name, {}, opts)

    const amplifyServiceRole = createAmplifyServiceRole(name, this)

    this.app = new amplify.App(
      `${name}-app`,
      {
        name,
        repository,
        iamServiceRoleArn: amplifyServiceRole.arn,
        accessToken: githubAccessToken,
        buildSpec: createMonorepoBuildSpec(appRoot),
        platform: 'WEB_COMPUTE',
        environmentVariables: {
          NODE_ENV: context.environment,
          AMPLIFY_DIFF_DEPLOY: 'true',
          AMPLIFY_DIFF_DEPLOY_ROOT: appRoot,
          AMPLIFY_MONOREPO_APP_ROOT: appRoot,
          _LIVE_UPDATES:
            '[{"name":"Amplify CLI","pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]',
          ...(environmentVariables ?? {}),
        },
        tags: {
          ...commonTags,
          Component: 'Amplify',
          AppRoot: appRoot,
        },
      },
      { parent: this, dependsOn: [amplifyServiceRole] },
    )

    this.branch = new amplify.Branch(
      `${name}-branch`,
      {
        appId: this.app.id,
        branchName,
        enableAutoBuild: false,
        framework: 'Next.js - SSR',
        stage: context.isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
        environmentVariables,
        tags: {
          ...commonTags,
          Component: 'AmplifyBranch',
        },
      },
      {
        parent: this.app,
        dependsOn: [amplifyServiceRole, this.app],
      },
    )

    if (domainName) {
      this.domainAssociation = this.createDomainAssociation({ domainName })
    }

    this.registerOutputs({
      app: this.app,
      branch: this.branch,
      domainAssociation: this.domainAssociation,
    })
  }

  private createDomainAssociation({
    domainName,
  }: AmplifyDomainAssociationConfig): amplify.DomainAssociation {
    return new amplify.DomainAssociation(
      `${this.app.name}-domain`,
      {
        domainName,
        appId: this.app.id,
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
