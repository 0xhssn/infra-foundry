import { Image } from '@pulumi/docker'
import { ComponentResourceOptions, Output } from '@pulumi/pulumi'

export interface DockerImageArgs {
  name: string
  imageName: Output<string> | string
  buildContext: string
  registry: Output<{
    server: string
    username: Output<string> | string
    password: Output<string> | string
  }>
  skipPush?: boolean
  buildArgs?: Record<string, string | Output<string>>
  dockerfile?: string
}

export class DockerImage extends Image {
  constructor(
    { name, imageName, buildContext, registry, skipPush, buildArgs, dockerfile }: DockerImageArgs,
    opts?: ComponentResourceOptions,
  ) {
    super(
      name,
      {
        imageName,
        build: {
          context: buildContext,
          dockerfile,
          args: buildArgs,
          platform: 'linux/amd64',
        },
        registry,
        skipPush,
      },
      opts,
    )
  }
}
