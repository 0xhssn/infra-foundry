import * as aws from '@pulumi/aws'
import { ComponentResource, ComponentResourceOptions, Output } from '@pulumi/pulumi'

import { OrganizationalUnitsConfig } from './types'
import { rootUrn } from '../utils/aliases'

/**
 * Reads the existing AWS Organization (which must already be enabled via the
 * console — `aws.organizations.Organization` is too dangerous to manage via
 * IaC) and creates a flat set of top-level OUs under the root.
 */
export class OrganizationalUnits extends ComponentResource {
  public readonly organization: ReturnType<typeof aws.organizations.getOrganizationOutput>
  public readonly rootId: Output<string>
  public readonly ous: Record<string, aws.organizations.OrganizationalUnit>

  constructor(
    name: string,
    config: OrganizationalUnitsConfig = {},
    opts?: ComponentResourceOptions,
  ) {
    super('infra-foundry:organizations:OrganizationalUnits', name, {}, opts)

    const ouNames = config.ouNames ?? ['Workloads', 'Sandbox']
    const useLegacyAliases = config.legacyRootAliases ?? false

    this.organization = aws.organizations.getOrganizationOutput()
    this.rootId = this.organization.roots.apply((r) => r[0].id)

    this.ous = Object.fromEntries(
      ouNames.map((ouName) => {
        const resourceName = ouName.toLowerCase()
        const ou = new aws.organizations.OrganizationalUnit(
          resourceName,
          {
            name: ouName,
            parentId: this.rootId,
          },
          {
            parent: this,
            aliases: useLegacyAliases
              ? [rootUrn('aws:organizations/organizationalUnit:OrganizationalUnit', resourceName)]
              : undefined,
          },
        )
        return [resourceName, ou]
      }),
    )

    this.registerOutputs({
      organization: this.organization,
      rootId: this.rootId,
      ous: this.ous,
    })
  }
}
