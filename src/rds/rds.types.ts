import { Input } from '@pulumi/pulumi'

export interface RdsComponentArgs {
  engine: Input<string>
  engineVersion: Input<string>
  instanceClass?: Input<string>
  allocatedStorage?: Input<number>
  storageType?: Input<string>

  dbName: Input<string>
  username: Input<string>
  password: Input<string>

  dbSubnetGroupName?: Input<string>
  publiclyAccessible?: Input<boolean>

  backupRetentionPeriod?: Input<number>
  backupWindow?: Input<string>
  maintenanceWindow?: Input<string>

  multiAz?: Input<boolean>
  enabledCloudwatchLogsExports?: Input<Input<string>[]>
  performanceInsightsEnabled?: Input<boolean>

  skipFinalSnapshot?: Input<boolean>
  tags?: Input<{ [key: string]: Input<string> }>
}
