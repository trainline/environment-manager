/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

/* eslint-disable no-console */

console.log('Loading EnvironmentManagerConfigurationChangeAudit function');

exports.handler = (event, context, callback) => {
  console.log('function starting...');
  const message = event.Records[0].Sns.Message;
  console.log('Configuration Change SNS:', message);
  callback(null, message);
};
