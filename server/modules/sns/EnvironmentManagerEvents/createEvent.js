/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const util = require('util');

module.exports = (event) => {
  // eslint-disable-next-line no-console
  console.log(`Creating event for ${util.inspect(event, { depth: null })}`);

  if (!event) {
    throw new Error('Expected a configuration object when creating an event.');
  }
  if (!event.message) {
    throw new Error('Missing expected message attribute.');
  }
  if (event.attributes) {
    checkAttributes(event);
  }
  return (target) => {
    return {
      Message: event.message,
      MessageAttributes: event.attributes,
      TargetArn: target
    };
  };
};

function checkAttributes(event) {
  const validAttrs = [
    'EnvironmentType',
    'Environment',
    'OwningCluster',
    'User',
    'Result',
    'Timestamp',
    'Action',
    'ID',
    'EntityURL'
  ];

  let foundNonValidAttributes = [];

  Object.keys(event.attributes).forEach((k) => {
    if (!validAttrs.includes(k)) {
      foundNonValidAttributes.push(k);
    } else {
      event.attributes[k] = turnProvidedValueIntoSnsAttribute(event.attributes[k]);
    }
  });

  if (!event.attributes.Timestamp) {
    event.attributes.Timestamp = turnProvidedValueIntoSnsAttribute(Date.now().toString());
  }

  if (foundNonValidAttributes.length > 0) {
    throw new Error(`Non valid attributes provided: ${foundNonValidAttributes.join(',')}`);
  }
}

function turnProvidedValueIntoSnsAttribute(value) {
  return {
    DataType: 'String',
    StringValue: value
  };
}
