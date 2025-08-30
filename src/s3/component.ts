import { s3, cloudfront } from '@pulumi/aws'
import { ComponentResource, ComponentResourceOptions, all } from '@pulumi/pulumi'

import { S3BucketConfig } from './types'
import { commonTags } from '../utils/commonTags'

export class S3Bucket extends ComponentResource {
  public readonly assetBucket: s3.Bucket
  public readonly assetsCdn: cloudfront.Distribution

  constructor({ name, contentExpiration }: S3BucketConfig, opts?: ComponentResourceOptions) {
    super('cloudforge:s3:S3Bucket', name, { name }, opts)

    this.assetBucket = this.createS3Bucket(name, contentExpiration)
    const originAccessIdentity = this.createOriginAccessIdentity(name)
    this.createBucketPolicy(name, this.assetBucket, originAccessIdentity)
    this.assetsCdn = this.createCloudFrontDistribution(name, this.assetBucket, originAccessIdentity)

    this.registerOutputs({
      assetBucket: this.assetBucket,
      assetsCdn: this.assetsCdn,
    })
  }

  private createS3Bucket(name: string, contentExpiration?: number): s3.Bucket {
    return new s3.Bucket(
      `${name}-assets-bucket`,
      {
        bucket: `${name}-assets`,
        acl: 'private',
        corsRules: [
          {
            allowedHeaders: ['*'],
            allowedMethods: ['GET', 'HEAD'],
            allowedOrigins: ['*'],
            maxAgeSeconds: 3000,
          },
        ],
        versioning: {
          enabled: true,
        },
        lifecycleRules: contentExpiration
          ? [
              {
                enabled: true,
                expiration: {
                  days: contentExpiration,
                },
                noncurrentVersionExpiration: {
                  days: contentExpiration,
                },
                abortIncompleteMultipartUploadDays: 7,
              },
            ]
          : undefined,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        tags: {
          ...commonTags,
          Component: 'S3',
        },
      },
      { parent: this },
    )
  }

  private createOriginAccessIdentity(name: string): cloudfront.OriginAccessIdentity {
    return new cloudfront.OriginAccessIdentity(`${name}-assets-oai`, {
      comment: `OAI for ${name} assets`,
    })
  }

  private createBucketPolicy(
    envScopedName: string,
    assetBucket: s3.Bucket,
    originAccessIdentity: cloudfront.OriginAccessIdentity,
  ): void {
    new s3.BucketPolicy(
      `${envScopedName}-assets-bucket-policy`,
      {
        bucket: assetBucket.id,
        policy: all([assetBucket.arn, originAccessIdentity.iamArn]).apply(
          ([bucketArn, oaiArn]: [string, string]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    AWS: oaiArn,
                  },
                  Action: 's3:GetObject',
                  Resource: `${bucketArn}/*`,
                },
              ],
            }),
        ),
      },
      { parent: assetBucket },
    )
  }

  private createCloudFrontDistribution(
    name: string,
    assetBucket: s3.Bucket,
    originAccessIdentity: cloudfront.OriginAccessIdentity,
  ): cloudfront.Distribution {
    return new cloudfront.Distribution(
      `${name}-assets-cdn`,
      {
        enabled: true,
        isIpv6Enabled: true,
        origins: [
          {
            domainName: assetBucket.bucketRegionalDomainName,
            originId: 'assetS3Origin',
            s3OriginConfig: {
              originAccessIdentity: originAccessIdentity.cloudfrontAccessIdentityPath,
            },
          },
        ],
        defaultCacheBehavior: {
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          targetOriginId: 'assetS3Origin',
          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
          viewerProtocolPolicy: 'redirect-to-https',
          minTtl: 0,
          defaultTtl: 86400, // 1 day
          maxTtl: 31536000, // 1 year
        },
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
        tags: {
          ...commonTags,
          Component: 'CloudFront',
        },
      },
      { parent: assetBucket },
    )
  }
}
