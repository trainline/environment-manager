/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = (ResponseMetadata) => {
  // eslint-disable-next-line no-console
  console.log('Getting TargetArn from ResponseMetadata');

  if (!ResponseMetadata.TopicArn) {
    throw new Error('ResponseMetadata does not contain a TopicArn value to extract.');
  }

  return ResponseMetadata.TopicArn;
};
