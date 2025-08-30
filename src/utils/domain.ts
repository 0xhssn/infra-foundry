import { context } from './context'

/**
 * Extracts the base domain from a full domain name.
 * @param {string} fullDomain - The complete domain name.
 * @returns {string} The base domain (last two parts).
 * @example
 * getBaseDomain("admin.multifamily.dopetech.com") // returns "dopetech.com"
 */
export function getBaseDomain(fullDomain: string): string {
  const parts = fullDomain.split('.')
  return parts.slice(-2).join('.')
}

/**
 * Extracts the subdomain from a full domain name.
 * @param {string} fullDomain - The complete domain name.
 * @returns {string} The subdomain part (everything before the base domain).
 * @example
 * getSubdomain("admin.multifamily.dopetech.com") // returns "admin.multifamily"
 */
export function getSubdomain(fullDomain: string): string {
  const baseDomain = getBaseDomain(fullDomain)
  return fullDomain.replace(`.${baseDomain}`, '')
}

/**
 * Sanitizes a domain or subdomain for use in resource names by replacing dots with dashes.
 * @param {string} domain - The domain string to sanitize.
 * @returns {string} The sanitized domain with dots replaced by dashes.
 * @example
 * sanitizeDomainForResourceName("admin.multifamily") // returns "admin-multifamily"
 */
export function sanitizeDomainForResourceName(domain: string): string {
  return domain.replace(/\./g, '-')
}

/**
 * Constructs an environment-specific project domain name based on the context.
 * @returns {string} The constructed environment-specific project domain name.
 * @example
 * buildProjectDomainName() // returns "dopetech.dopetech.com" for { isProduction: true, project: "dopetech", environment: "dev" }
 */
export function buildProjectDomainName(): string {
  return `${context.project}.dopetech.com`
}

/**
 * Constructs a service-specific domain name by prepending the service name to the environment-specific project domain.
 * @param {string} service - The service name to prepend to the domain.
 * @returns {string} The constructed service-specific domain name.
 * @example
 * buildServiceDomainName("api") // returns "api.dopetech.dopetech.com" for { isProduction: true, project: "dopetech", environment: "dev" }
 * buildServiceDomainName("api") // returns "api.dev.dopetech.dopetech.com" for { isProduction: false, project: "dopetech", environment: "dev" }
 */
export function buildServiceDomainName(service: string, baseDomain?: string): string {
  const { isProduction, environment } = context
  const projectDomain = baseDomain || buildProjectDomainName()

  return isProduction ? `${service}.${projectDomain}` : `${service}.${environment}.${projectDomain}`
}
