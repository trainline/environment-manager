'use strict';

module.exports = {
  id: 'GetTargetStateQuery',
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'Get Target State Query',
  description: 'Query the value of the desired target state for a deployment',
  type: 'object',
  allOf: [
    { $ref: 'ConsulConnectCommon' },
    { $ref: '#/definitions/self' },
  ],
  definitions: {
    self: {
      type: 'object',
      properties: {
        key: { $ref: 'ConsulKey' },
        name: {
          type: 'string',
          pattern: '^GetTargetState$',
        },
        recurse: {
          type: 'boolean',
        },
      },
      required: ['key', 'name'],
    },
  },
};
