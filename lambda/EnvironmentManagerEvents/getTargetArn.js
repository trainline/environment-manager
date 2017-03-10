'use strict';

module.exports = (ResponseMetadata) => {
  if (!ResponseMetadata.TopicArn)
    throw new Error('ResponseMetadata does not contain a TopicArn value to extract.');
  return ResponseMetadata.TopicArn;
};
