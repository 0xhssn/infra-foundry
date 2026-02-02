import { ses, route53 } from '@pulumi/aws'
import { ComponentResource, ComponentResourceOptions, Output } from '@pulumi/pulumi'

import {
  createSESDomainIdentity,
  createSESEmailIdentity,
  setupDkimConfiguration,
  createSESConfigurationSet,
} from './service'
import { SesComponentArgs, SesWithRoute53Args } from './types'
import { createRoute53VerificationRecord } from '../route53/service'
import { DnsRecord } from '../route53/types'
import { addEnvSuffix } from '../utils/addEnvSuffix'

export class Ses extends ComponentResource {
  public readonly domainIdentity: ses.DomainIdentity
  public readonly emailIdentity?: ses.EmailIdentity
  public readonly dkimTokens?: ses.DomainDkim
  public readonly configurationSet?: ses.ConfigurationSet
  public readonly verificationRecord: DnsRecord
  public readonly dkimRecords?: Output<DnsRecord[]>

  constructor(name: string, args: SesComponentArgs, opts?: ComponentResourceOptions) {
    super('infra-foundry:ses:Ses', name, {}, opts)

    const resourceName = addEnvSuffix(args.name)

    this.domainIdentity = createSESDomainIdentity(args.domainName, resourceName, this)
    this.emailIdentity = args.fromEmail
      ? createSESEmailIdentity(args.fromEmail, resourceName, this)
      : undefined
    this.configurationSet = args.configurationSetName
      ? createSESConfigurationSet(args.configurationSetName, args, resourceName, this)
      : undefined

    this.verificationRecord = {
      name: `_amazonses.${args.domainName}`,
      value: this.domainIdentity.verificationToken,
      type: 'TXT',
    }

    const dkimConfig = args.enableDkim
      ? setupDkimConfiguration(args, this.domainIdentity, resourceName, this)
      : {}
    this.dkimTokens = dkimConfig.dkimTokens
    this.dkimRecords = dkimConfig.dkimRecords

    this.registerOutputs({
      domainIdentity: this.domainIdentity,
      emailIdentity: this.emailIdentity,
      dkimTokens: this.dkimTokens,
      configurationSet: this.configurationSet,
      verificationRecord: this.verificationRecord,
      dkimRecords: this.dkimRecords,
    })
  }
}

export class SesWithRoute53 extends ComponentResource {
  public readonly sesComponent: Ses
  public readonly verificationRecord: route53.Record
  public readonly dkimRecords?: route53.Record[]

  constructor(name: string, args: SesWithRoute53Args, opts?: ComponentResourceOptions) {
    super('infra-foundry:ses:SesWithRoute53', name, {}, opts)

    const resourceName = addEnvSuffix(args.name)
    const { hostedZoneId, ...sesArgs } = args

    this.sesComponent = new Ses(`${name}-ses`, sesArgs, { parent: this })

    this.verificationRecord = createRoute53VerificationRecord(
      resourceName,
      this.sesComponent.verificationRecord,
      hostedZoneId,
      this,
    )

    if (this.sesComponent.dkimRecords) {
      this.dkimRecords = []
      this.sesComponent.dkimRecords.apply((records) => {
        records.forEach((record, index) => {
          const dkimRecord = createRoute53VerificationRecord(
            `${resourceName}-dkim-record-${index}`,
            record,
            hostedZoneId,
            this,
          )
          this.dkimRecords!.push(dkimRecord)
        })
      })
    }

    this.registerOutputs({
      sesComponent: this.sesComponent,
      verificationRecord: this.verificationRecord,
      dkimRecords: this.dkimRecords,
    })
  }
}
