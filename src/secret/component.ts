import { secretsmanager } from '@pulumi/aws'
import { ComponentResource, ComponentResourceOptions, Output, all } from '@pulumi/pulumi'

import { commonTags } from '../utils/commonTags'

export interface SecretConfig {
  name: string
  description?: string
  values: Record<string, string | Output<string>>
}

export class Secret extends ComponentResource {
  public readonly secret: secretsmanager.Secret
  public readonly secretVersion: secretsmanager.SecretVersion

  constructor({ name, description, values }: SecretConfig, opts?: ComponentResourceOptions) {
    super('cloudforge:asm:Secret', name, {}, opts)

    this.secret = new secretsmanager.Secret(
      name,
      {
        name,
        description,
        tags: commonTags,
      },
      { parent: this },
    )

    // todo: use mapToNameValuePairs when migrating to cloudforge
    const mappedValues = Object.entries(values).map(([key, value]) => ({
      key,
      value,
    }))

    const secretString = all(mappedValues.map((v) => v.value)).apply((resolvedValues) => {
      const secretObject = mappedValues.reduce(
        (acc, { key }, index) => {
          acc[key] = resolvedValues[index]
          return acc
        },
        {} as Record<string, string>,
      )
      return JSON.stringify(secretObject)
    })

    this.secretVersion = new secretsmanager.SecretVersion(
      `${name}-version`,
      {
        secretId: this.secret.id,
        secretString,
      },
      { parent: this.secret },
    )

    this.registerOutputs({
      secret: this.secret,
      secretVersion: this.secretVersion,
    })
  }
}
