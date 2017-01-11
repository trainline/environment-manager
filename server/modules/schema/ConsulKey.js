'use strict';

module.exports = {
  id: 'ConsulKey',
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'Consul Key',
  description: 'Consul Key-Value Store Key',
  type: 'string',
  minLength: 1,
  maxLength: 255,
};
