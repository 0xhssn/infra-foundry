import { Output } from '@pulumi/pulumi'

export interface SesComponentArgs {
  name: string
  domainName: string
  fromEmail?: string
  configurationSetName?: string
  enableDkim?: boolean
  enableNotifications?: boolean
  bounceTopicArn?: string
  complaintTopicArn?: string
}

export interface SesWithRoute53Args extends SesComponentArgs {
  hostedZoneId: Output<string>
}
