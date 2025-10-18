import { ecr } from '@pulumi/aws'
import { interpolate, Output } from '@pulumi/pulumi'

import { EcrRepository } from '../ecr/component'

export function buildImageUri(repo: EcrRepository, imageTag?: string) {
  if (imageTag) {
    return interpolate`${repo.repository.repositoryUrl}:${imageTag}`
  }
  return repo.getLatestImageUri()
}

export interface EcrRegistryAuthorization {
  server: string
  username: Output<string>
  password: Output<string>
}

export function fetchEcrRegistryAuthorization(): Output<EcrRegistryAuthorization> {
  const creds = ecr.getAuthorizationTokenOutput()
  return creds.proxyEndpoint.apply((endpoint) => ({
    server: endpoint,
    username: creds.userName,
    password: creds.password,
  }))
}
