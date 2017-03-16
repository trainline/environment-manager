/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

console.log('Loading function');

exports.handler = (event, context, callback) => {
  console.log('function starting...');
  const message = event.Records[0].Sns.Message;
  console.log('Operations Change SNS:', message);
  callback(null, message);
};
