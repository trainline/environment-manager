'use strict';

module.exports = {
  id: 'AccountName',
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'Account Name',
  description: 'An Account Name',
  type: 'string',
  minLength: 1,
  maxLength: 255,
  pattern: '^[a-zA-Z][0-9a-zA-Z\.\-_]*$',
};
