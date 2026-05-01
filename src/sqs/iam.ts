import { iam } from '@pulumi/aws'
import { ComponentResource, Input, jsonStringify } from '@pulumi/pulumi'

const consumerActions = [
  'sqs:ReceiveMessage',
  'sqs:DeleteMessage',
  'sqs:DeleteMessageBatch',
  'sqs:ChangeMessageVisibility',
  'sqs:ChangeMessageVisibilityBatch',
  'sqs:GetQueueAttributes',
  'sqs:GetQueueUrl',
]

const producerActions = [
  'sqs:SendMessage',
  'sqs:SendMessageBatch',
  'sqs:GetQueueAttributes',
  'sqs:GetQueueUrl',
]

function buildPolicyJson(actions: string[], queueArns: Input<Input<string>[]>) {
  return jsonStringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: actions,
        Resource: queueArns,
      },
    ],
  })
}

export function attachSqsConsumerPolicyToRole(
  name: string,
  role: iam.Role,
  queueArns: Input<Input<string>[]>,
  parent?: ComponentResource,
): iam.RolePolicy {
  return new iam.RolePolicy(
    `${name}-sqs-consumer`,
    {
      role: role.name,
      policy: buildPolicyJson(consumerActions, queueArns),
    },
    { parent },
  )
}

export function attachSqsProducerPolicyToRole(
  name: string,
  role: iam.Role,
  queueArns: Input<Input<string>[]>,
  parent?: ComponentResource,
): iam.RolePolicy {
  return new iam.RolePolicy(
    `${name}-sqs-producer`,
    {
      role: role.name,
      policy: buildPolicyJson(producerActions, queueArns),
    },
    { parent },
  )
}
