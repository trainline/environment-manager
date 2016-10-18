'use strict';

module.exports = {
  id: 'DeleteTargetStateCommand',
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'Delete Target State Command',
  description: 'Delete a the target state for a service',
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
          pattern: '^DeleteTargetState$',
        },
      },
      required: ['key', 'name'],
    },
  },
};
