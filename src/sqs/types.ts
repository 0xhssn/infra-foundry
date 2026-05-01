import { Input } from '@pulumi/pulumi'

export type SqsQueueType = 'standard' | 'fifo'

export interface SqsDeadLetterAutoCreate {
  enabled: true
  maxReceiveCount?: number
  retentionSeconds?: number
}

export interface SqsDeadLetterExternal {
  enabled?: never
  targetArn: Input<string>
  maxReceiveCount?: number
}

export type SqsDeadLetterConfig = SqsDeadLetterAutoCreate | SqsDeadLetterExternal

export interface SqsKmsConfig {
  kmsMasterKeyId: Input<string>
  dataKeyReusePeriodSeconds?: number
}

export interface SqsQueueConfig {
  name: string
  type?: SqsQueueType

  visibilityTimeoutSeconds?: number
  messageRetentionSeconds?: number
  maxMessageSize?: number
  delaySeconds?: number
  receiveWaitTimeSeconds?: number

  contentBasedDeduplication?: boolean
  deduplicationScope?: 'messageGroup' | 'queue'
  fifoThroughputLimit?: 'perQueue' | 'perMessageGroupId'

  deadLetter?: SqsDeadLetterConfig
  kms?: SqsKmsConfig
  policy?: Input<string>
}
