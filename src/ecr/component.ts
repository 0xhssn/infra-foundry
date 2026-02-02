import { ecr } from '@pulumi/aws'
import {
  ComponentResource,
  ComponentResourceOptions,
  Output,
  all,
  interpolate,
} from '@pulumi/pulumi'

import { commonTags } from '../utils/commonTags'

export interface EcrRepositoryArgs {
  name: string
  maxImages?: number
}

export class EcrRepository extends ComponentResource {
  public readonly repository: ecr.Repository

  constructor({ name, maxImages = 2 }: EcrRepositoryArgs, opts?: ComponentResourceOptions) {
    super('infra-foundry:ecr:EcrRepository', name, {}, opts)

    this.repository = new ecr.Repository(
      name,
      {
        name,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        forceDelete: true,
        tags: commonTags,
      },
      { parent: this },
    )

    new ecr.LifecyclePolicy(
      `${name}-lifecycle-policy`,
      {
        repository: this.repository.name,
        policy: JSON.stringify({
          rules: [
            {
              rulePriority: 1,
              description: `Retain only ${maxImages} most recent images`,
              selection: {
                tagStatus: 'any',
                countType: 'imageCountMoreThan',
                countNumber: maxImages,
              },
              action: {
                type: 'expire',
              },
            },
          ],
        }),
      },
      { parent: this.repository },
    )

    this.registerOutputs({
      repository: this.repository,
    })
  }

  getLatestImageUri(): Output<string> {
    return all([this.repository.name, this.repository.repositoryUrl]).apply(async ([name, url]) => {
      const image = await ecr.getImage({
        repositoryName: name,
        mostRecent: true,
      })

      const tag = image.imageTags?.[0]
      if (!tag) {
        throw new Error(`No image tag found in repository: ${name}`)
      }

      return `${url.toLowerCase()}:${tag}`
    })
  }

  getImageUriByTag(tag: string): Output<string> {
    const taggedImage = ecr.getImageOutput({
      repositoryName: this.repository.name,
      imageTag: tag,
    })

    return interpolate`${this.repository.repositoryUrl}@${taggedImage.imageDigest}`
  }
}
