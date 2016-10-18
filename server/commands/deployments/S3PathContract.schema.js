'use strict';

module.exports = {
  id: 'http://thetrainline.com/environment-manager/S3PathContract-schema#',
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'S3PathContract',
  description: 'It represents the path of an object in S3',
  type: 'object',
  properties: {
    bucket: {
      description: 'Name of the S3 bucket',
      type: 'string',
    },
    key: {
      description: 'Name of the S3 key',
      type: 'string',
    },
  },
  required: [
    'bucket',
    'key',
  ],
};
