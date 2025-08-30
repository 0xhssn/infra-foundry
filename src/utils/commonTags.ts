import { context } from './context'

export const commonTags = {
  Project: context.project,
  Environment: context.environment,
  ManagedBy: 'Pulumi',
}
