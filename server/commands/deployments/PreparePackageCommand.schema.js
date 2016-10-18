'use strict';

module.exports = {
  id: 'http://thetrainline.com/environment-manager/command/PreparePackageCommand-schema#',
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'PreparePackageCommand',
  description: 'A command to download deployment map, convert it to a CodeDeploy archive and upload it to S3',
  type: 'object',
  properties: {
    accountName: {
      description: 'The name of the account that owns the S3 bucket',
      type: 'string',
      minLength: 1,
      maxLength: 255,
    },
    destination: { $ref: '#/definitions/s3destination' },
    source: { $ref: '#/definitions/sourcePackage' },
  },
  required: ['accountName', 'destination', 'source'],

  definitions: {
    sourcePackage: {
      description: 'Describes a package that can be converted to a CodeDeploy archive',
      type: 'object',
      oneOf: [
        { $ref: '#/definitions/codeDeployRevision' },
        { $ref: '#/definitions/deploymentMap' },
      ],
    },
    s3destination: {
      description: 'Describes an S3 location',
      type: 'object',
      properties: {
        bucket: {
          description: 'S3 bucket',
          type: 'string',
          minLength: 1,
          maxLength: 255,
        },
        key: {
          description: 'S3 key',
          type: 'string',
          minLength: 1,
          maxLength: 1024,
        },
      },
      required: ['bucket', 'key'],
    },
    codeDeployRevision: {
      description: 'Describes a CodeDeploy revision as a source package',
      type: 'object',
      properties: {
        type: {
          type: 'string',
          pattern: '^CodeDeployRevision$',
        },
        url: { $ref: '#/definitions/url' },
      },
      required: ['type', 'url'],
    },
    deploymentMap: {
      description: 'Describes a Deployment Map as a source package',
      type: 'object',
      properties: {
        type: {
          type: 'string',
          pattern: '^DeploymentMap$',
        },
        id: {
          description: 'The name of the deployment map',
          type: 'string',
          minLength: 1,
          maxLength: 127,
        },
        version: { $ref: '#/definitions/semver' },
      },
      required: ['id', 'type', 'version'],
    },
    semver: {
      type: 'string',
      minLength: 1,
      maxLength: 127,
      pattern: '^[0-9]+\.[0-9]+\.[0-9]+(-.+)?', //TODO: Check redundant escapes in regex (eslint no-useless-escape)
    },
    url: {
      type: 'string',
      pattern: '^https?://',
    },
  },
};
