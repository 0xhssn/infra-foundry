export interface OrganizationalUnitsConfig {
  /**
   * Names of OUs to create directly under the org root.
   * Defaults to ['Workloads', 'Sandbox'].
   */
  ouNames?: string[]
  /**
   * Opt in to URN aliases that preserve state from when these OUs lived at
   * the project root (before being wrapped in this component). Set true only
   * when migrating an existing stack — never for new deployments.
   */
  legacyRootAliases?: boolean
}
