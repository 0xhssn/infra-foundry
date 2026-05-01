import { sqs } from '@pulumi/aws'
import {
  ComponentResource,
  ComponentResourceOptions,
  Input,
  Output,
  jsonStringify,
} from '@pulumi/pulumi'

import { SqsQueueConfig } from './types'
import { addEnvSuffix } from '../utils/addEnvSuffix'
import { commonTags } from '../utils/commonTags'

const DEFAULT_VISIBILITY_TIMEOUT = 30
const DEFAULT_MESSAGE_RETENTION = 345_600
const DEFAULT_MAX_MESSAGE_SIZE = 262_144
const DEFAULT_DELAY = 0
const DEFAULT_RECEIVE_WAIT = 20
const DEFAULT_DLQ_RETENTION = 1_209_600
const DEFAULT_MAX_RECEIVE_COUNT = 5

export class SqsQueue extends ComponentResource {
  public readonly queue: sqs.Queue
  public readonly deadLetterQueue?: sqs.Queue
  public readonly url: Output<string>
  public readonly arn: Output<string>
  public readonly name: Output<string>

  constructor(config: SqsQueueConfig, opts?: ComponentResourceOptions) {
    const {
      name,
      type,
      visibilityTimeoutSeconds = DEFAULT_VISIBILITY_TIMEOUT,
      messageRetentionSeconds = DEFAULT_MESSAGE_RETENTION,
      maxMessageSize = DEFAULT_MAX_MESSAGE_SIZE,
      delaySeconds = DEFAULT_DELAY,
      receiveWaitTimeSeconds = DEFAULT_RECEIVE_WAIT,
      contentBasedDeduplication,
      deduplicationScope,
      fifoThroughputLimit,
      deadLetter,
      kms,
      policy,
    } = config

    const resourceName = addEnvSuffix(name)
    super('infra-foundry:sqs:SqsQueue', resourceName, {}, opts)

    const isFifo = type === 'fifo'
    const queueAwsName = isFifo ? `${resourceName}.fifo` : resourceName
    const tags = { ...commonTags, Component: 'SQS' }

    let dlqArn: Input<string> | undefined
    let maxReceiveCount: number | undefined

    if (deadLetter?.enabled) {
      const {
        retentionSeconds = DEFAULT_DLQ_RETENTION,
        maxReceiveCount: dlqMax = DEFAULT_MAX_RECEIVE_COUNT,
      } = deadLetter

      const dlqResourceName = `${resourceName}-dlq`
      const dlqAwsName = isFifo ? `${dlqResourceName}.fifo` : dlqResourceName

      this.deadLetterQueue = new sqs.Queue(
        dlqResourceName,
        {
          name: dlqAwsName,
          fifoQueue: isFifo || undefined,
          messageRetentionSeconds: retentionSeconds,
          kmsMasterKeyId: kms?.kmsMasterKeyId,
          kmsDataKeyReusePeriodSeconds: kms?.dataKeyReusePeriodSeconds,
          tags: { ...tags, Role: 'DLQ' },
        },
        { parent: this },
      )

      dlqArn = this.deadLetterQueue.arn
      maxReceiveCount = dlqMax
    } else if (deadLetter && 'targetArn' in deadLetter) {
      const { targetArn, maxReceiveCount: extMax = DEFAULT_MAX_RECEIVE_COUNT } = deadLetter
      dlqArn = targetArn
      maxReceiveCount = extMax
    }

    const redrivePolicy = dlqArn
      ? jsonStringify({ deadLetterTargetArn: dlqArn, maxReceiveCount })
      : undefined

    this.queue = new sqs.Queue(
      resourceName,
      {
        name: queueAwsName,
        fifoQueue: isFifo || undefined,
        visibilityTimeoutSeconds,
        messageRetentionSeconds,
        maxMessageSize,
        delaySeconds,
        receiveWaitTimeSeconds,
        contentBasedDeduplication: isFifo ? contentBasedDeduplication : undefined,
        deduplicationScope: isFifo ? deduplicationScope : undefined,
        fifoThroughputLimit: isFifo ? fifoThroughputLimit : undefined,
        kmsMasterKeyId: kms?.kmsMasterKeyId,
        kmsDataKeyReusePeriodSeconds: kms?.dataKeyReusePeriodSeconds,
        redrivePolicy,
        tags,
      },
      { parent: this },
    )

    if (policy) {
      new sqs.QueuePolicy(
        `${resourceName}-policy`,
        {
          queueUrl: this.queue.url,
          policy,
        },
        { parent: this },
      )
    }

    this.url = this.queue.url
    this.arn = this.queue.arn
    this.name = this.queue.name

    this.registerOutputs({
      queue: this.queue,
      deadLetterQueue: this.deadLetterQueue,
      url: this.url,
      arn: this.arn,
      name: this.name,
    })
  }
}
