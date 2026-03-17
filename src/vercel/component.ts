import { ComponentResource, ComponentResourceOptions, Output } from '@pulumi/pulumi'
import { Project, ProjectEnvironmentVariable, ProjectDomain } from '@pulumiverse/vercel'

import { VercelProjectConfig } from './types'

export class VercelProject extends ComponentResource {
  public readonly project: Project
  public readonly environmentVariables: ProjectEnvironmentVariable[]
  public readonly domainResource?: ProjectDomain
  public readonly projectId: Output<string>
  public readonly projectName: Output<string>
  public readonly domain: Output<string>

  constructor(name: string, config: VercelProjectConfig, opts?: ComponentResourceOptions) {
    super('infra-foundry:vercel:VercelProject', name, {}, opts)

    const {
      framework = 'nextjs',
      teamId,
      customDomain,
      gitRepo,
      environmentVariables = [],
    } = config

    this.project = new Project(
      name,
      {
        name: config.name,
        framework,
        ...(gitRepo ? { gitRepository: { type: 'github', repo: gitRepo } } : {}),
        ...(teamId ? { teamId } : {}),
      },
      { parent: this },
    )

    this.environmentVariables = environmentVariables.map((envVar) => {
      const resourceName = `${name}-env-${envVar.key.toLowerCase().replace(/_/g, '-')}-${envVar.targets.join('-')}`
      return new ProjectEnvironmentVariable(
        resourceName,
        {
          projectId: this.project.id,
          key: envVar.key,
          value: envVar.value,
          targets: envVar.targets,
          ...(envVar.sensitive ? { sensitive: envVar.sensitive } : {}),
          ...(teamId ? { teamId } : {}),
        },
        { parent: this.project },
      )
    })

    if (customDomain) {
      this.domainResource = new ProjectDomain(
        `${name}-domain`,
        {
          projectId: this.project.id,
          domain: customDomain,
          ...(teamId ? { teamId } : {}),
        },
        { parent: this.project },
      )
    }

    this.projectId = this.project.id
    this.projectName = this.project.name
    this.domain = this.domainResource
      ? this.domainResource.domain
      : Output.create(`${config.name}.vercel.app`)

    this.registerOutputs({
      project: this.project,
      environmentVariables: this.environmentVariables,
      domainResource: this.domainResource,
      projectId: this.projectId,
      projectName: this.projectName,
      domain: this.domain,
    })
  }
}
