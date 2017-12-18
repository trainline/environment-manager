/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let aws = require('aws-sdk');

module.exports = (event) => {
  if (!event.TargetArn) {
    throw new Error('An event to be published must contain a TargetArn property.');
  }

  if (!event.Message) {
    throw new Error('An event to be published must contain a Message property.');
  }

  if (event.MessageAttributes) {
    Object.keys(event.MessageAttributes).forEach((k) => {
      if (!event.MessageAttributes[k].DataType) {
        throw new Error('All MessageAttribute values must contain a DataType property.');
      }
    });
  }

  const sns = new aws.SNS();

  return new Promise((resolve, reject) => {
    sns.publish(event, (err, result) => {
      if (err) reject(err);
      return resolve(result);
    });
  });
};
