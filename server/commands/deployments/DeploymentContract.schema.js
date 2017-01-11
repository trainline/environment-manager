'use strict';

module.exports = {
  id: 'http://thetrainline.com/environment-manager/DeploymentContract-schema#',
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'DeploymentContract',
  description: 'It represents a service deployment to a specific environment',
  type: 'object',
  properties: {
    id: {
      description: 'The deployment unique ID',
      type: 'string',
      minLength: 36,
      maxLength: 36,
      pattern: '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}'
    },
    environmentTypeName: {
      description: 'The type of environment in which deploy the service',
      type: 'string'
    },
    environmentName: {
      description: 'The name of environment in which deploy the service',
      type: 'string'
    },
    serverRole: {
      description: 'The name of the logical serverRole in which deploy the service',
      type: 'string'
    },
    serviceName: {
      description: 'The name of the service to deploy',
      type: 'string'
    },
    serviceVersion: {
      description: 'The version of the service to deploy',
      type: 'string',
      pattern: '^[0-9]+\.[0-9]+\.[0-9]+(-.+)?' // TODO: Check redundant escapes in regex (eslint no-useless-escape)
    },
    serviceSlice: {
      description: 'The name of the slice of the service to deploy',
      type: 'string',
      pattern: '^(blue|green)$'
    },
    clusterName: {
      description: 'The name of the owning cluster',
      type: 'string'
    },
    accountName: {
      description: 'The name of the AWS account',
      type: 'string'
    },
    username: {
      description: 'The name of the user',
      type: 'string'
    }
  },
  required: [
    'id',
    'environmentTypeName',
    'environmentName',
    'serverRole',
    'serviceName',
    'serviceVersion',
    'clusterName',
    'accountName',
    'username'
  ]
};
