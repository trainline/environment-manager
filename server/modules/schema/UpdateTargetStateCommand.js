'use strict';

module.exports = {
  id: 'UpdateTargetStateCommand',
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'Update Target State Command',
  description: 'Update the the target state of a service',
  type: 'object',
  allOf: [
    { $ref: 'ConsulConnectCommon' },
    { $ref: '#/definitions/self' }
  ],
  definitions: {
    self: {
      type: 'object',
      properties: {
        key: { $ref: 'ConsulKey' },
        name: {
          type: 'string',
          pattern: '^UpdateTargetState$'
        }
      },
      required: ['key', 'name', 'value']
    }
  }
};
