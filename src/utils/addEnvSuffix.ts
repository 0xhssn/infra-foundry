import { context } from './context'

/**
 * Creates an environment-scoped name by combining a base name with the current environment
 * @param name The base name to scope (e.g., app name, resource name)
 * @returns The scoped name in the format "name-environment"
 * @example
 * addEnvSuffix("admin-portal") // returns "admin-portal-dev" (if environment is "dev")
 */
export function addEnvSuffix(name: string) {
  return `${name}-${context.environment}`
}
