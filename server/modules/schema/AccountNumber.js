'use strict';

module.exports = {
  id: 'AccountNumber',
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'Account Number',
  description: 'An AWS Account Number',
  type: 'string',
  minLength: 12,
  maxLength: 12,
  pattern: '^[0-9]+$'
};
