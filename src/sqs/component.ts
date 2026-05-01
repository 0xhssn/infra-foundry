import * as aws from '@pulumi/aws'
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
  public readonly queue: aws.sqs.Queue
  public readonly deadLetterQueue?: aws.sqs.Queue
  public readonly url: Output<string>
  public readonly arn: Output<string>
  public readonly name: Output<string>

  constructor(config: SqsQueueConfig, opts?: ComponentResourceOptions) {
    const resourceName = addEnvSuffix(config.name)
    super('infra-foundry:sqs:SqsQueue', resourceName, {}, opts)

    const isFifo = config.type === 'fifo'
    const queueAwsName = isFifo ? `${resourceName}.fifo` : resourceName
    const tags = { ...commonTags, Component: 'SQS' }

    let dlqArn: Input<string> | undefined
    let maxReceiveCount: number | undefined

    if (config.deadLetter && 'enabled' in config.deadLetter && config.deadLetter.enabled) {
      const dlqResourceName = `${resourceName}-dlq`
      const dlqAwsName = isFifo ? `${dlqResourceName}.fifo` : dlqResourceName

      this.deadLetterQueue = new aws.sqs.Queue(
        dlqResourceName,
        {
          name: dlqAwsName,
          fifoQueue: isFifo || undefined,
          messageRetentionSeconds: config.deadLetter.retentionSeconds ?? DEFAULT_DLQ_RETENTION,
          kmsMasterKeyId: config.kms?.kmsMasterKeyId,
          kmsDataKeyReusePeriodSeconds: config.kms?.dataKeyReusePeriodSeconds,
          tags: { ...tags, Role: 'DLQ' },
        },
        { parent: this },
      )

      dlqArn = this.deadLetterQueue.arn
      maxReceiveCount = config.deadLetter.maxReceiveCount ?? DEFAULT_MAX_RECEIVE_COUNT
    } else if (config.deadLetter && 'targetArn' in config.deadLetter) {
      dlqArn = config.deadLetter.targetArn
      maxReceiveCount = config.deadLetter.maxReceiveCount ?? DEFAULT_MAX_RECEIVE_COUNT
    }

    const redrivePolicy = dlqArn
      ? jsonStringify({ deadLetterTargetArn: dlqArn, maxReceiveCount })
      : undefined

    this.queue = new aws.sqs.Queue(
      resourceName,
      {
        name: queueAwsName,
        fifoQueue: isFifo || undefined,
        visibilityTimeoutSeconds: config.visibilityTimeoutSeconds ?? DEFAULT_VISIBILITY_TIMEOUT,
        messageRetentionSeconds: config.messageRetentionSeconds ?? DEFAULT_MESSAGE_RETENTION,
        maxMessageSize: config.maxMessageSize ?? DEFAULT_MAX_MESSAGE_SIZE,
        delaySeconds: config.delaySeconds ?? DEFAULT_DELAY,
        receiveWaitTimeSeconds: config.receiveWaitTimeSeconds ?? DEFAULT_RECEIVE_WAIT,
        contentBasedDeduplication: isFifo ? config.contentBasedDeduplication : undefined,
        deduplicationScope: isFifo ? config.deduplicationScope : undefined,
        fifoThroughputLimit: isFifo ? config.fifoThroughputLimit : undefined,
        kmsMasterKeyId: config.kms?.kmsMasterKeyId,
        kmsDataKeyReusePeriodSeconds: config.kms?.dataKeyReusePeriodSeconds,
        redrivePolicy,
        tags,
      },
      { parent: this },
    )

    if (config.policy) {
      new aws.sqs.QueuePolicy(
        `${resourceName}-policy`,
        {
          queueUrl: this.queue.url,
          policy: config.policy,
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
