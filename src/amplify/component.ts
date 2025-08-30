import { amplify } from '@pulumi/aws'
import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi'

import { DEFAULT_BUILD_SPEC } from './constants'
import { setupAmplifyCicdPolicy, setupAmplifyDomainRole } from './iam'
import { AmplifyAppConfig, AmplifyDomainAssociationConfig, AmplifyBranchConfig } from './types'
import { addEnvSuffix } from '../utils/addEnvSuffix'
import { commonTags } from '../utils/commonTags'
import { context } from '../utils/context'
import { Environment } from '../utils/environment'

export class AmplifyApp extends ComponentResource {
  public readonly app: amplify.App
  public readonly branches: Map<Environment, amplify.Branch>
  
  public get branch(): amplify.Branch {
    const currentEnvBranch = this.branches.get(context.environment)
    if (currentEnvBranch) {
      return currentEnvBranch
    }
  
    const firstBranch = this.branches.values().next().value
    if (!firstBranch) {
      throw new Error('No branches configured. Please ensure at least one branch is configured in AmplifyAppConfig.branches')
    }
    return firstBranch
  }

  constructor(name: string, config: AmplifyAppConfig, opts?: ComponentResourceOptions) {
    super('cloudforge:amplify:AmplifyApp', name, {}, opts)

    this.branches = new Map<Environment, amplify.Branch>()
    
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
          _LIVE_UPDATES:
            '[{"name":"Amplify CLI","pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]',
          ...config.defaultEnvironmentVariables,
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

    config.branches.forEach((branchConfig) => {
      const branch = new amplify.Branch(
        `${config.appName}-${branchConfig.environment}-branch`,
        {
          appId: this.app.id,
          branchName: branchConfig.branchName,
          enableAutoBuild: branchConfig.enableAutoBuild ?? true,
          framework: 'Next.js - SSR',
          stage: branchConfig.stage ?? 
            (branchConfig.environment === Environment.Prod ? 'PRODUCTION' : 'DEVELOPMENT'),
          environmentVariables: {
            NODE_ENV: branchConfig.environment,
            BACKEND_API_URL: branchConfig.backendApiUrl,
            ...branchConfig.environmentVariables,
          },
          tags: {
            ...commonTags,
            Component: 'AmplifyBranch',
            Environment: branchConfig.environment,
          },
        },
        {
          parent: this.app,
          dependsOn: [amplifyCicdRole, amplifyCicdPolicy, this.app],
        },
      )
      
      this.branches.set(branchConfig.environment, branch)
    })

    this.registerOutputs({
      app: this.app,
      branches: this.branches,
    })
  }

  public createDomainAssociation(
    config: AmplifyDomainAssociationConfig,
  ): amplify.DomainAssociation {
    const envScopedName = addEnvSuffix(config.appName)
    
    const subDomains = config.branches.map((branch, index) => {
      const environment = Array.from(this.branches.entries())
        .find(([_, b]) => b === branch)?.[0]
      
      let prefix = ''
      if (config.subdomainMapping && environment) {
        prefix = config.subdomainMapping[environment] || ''
      } else if (environment && environment !== Environment.Prod) {
        prefix = environment === Environment.Staging ? 'staging' : environment
      }
      
      return {
        branchName: branch.branchName,
        prefix,
      }
    })
    
    return new amplify.DomainAssociation(
      `${envScopedName}-domain`,
      {
        appId: this.app.id,
        domainName: config.domainName,
        subDomains,
        waitForVerification: false,
      },
      {
        parent: this.app,
        dependsOn: [this.app, ...config.branches],
      },
    )
  }
  
  public getBranch(environment: Environment): amplify.Branch | undefined {
    return this.branches.get(environment)
  }
  
  public getAllBranches(): amplify.Branch[] {
    return Array.from(this.branches.values())
  }
  
  public getEnvironments(): Environment[] {
    return Array.from(this.branches.keys())
  }
}
