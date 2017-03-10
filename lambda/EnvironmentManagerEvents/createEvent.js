/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const util = require('util');

module.exports = (event) => {
  console.log(`Creating event for ${util.inspect(event, { depth: null })}`);

  if (!event)
    throw new Error('Expected a configuration object when creating an event.');

  if (!event.message)
    throw new Error('Missing expected message attribute.');

  Object.keys(event.attributes).forEach((k) => {
    if (!event.attributes[k].DataType)
      throw new Error('Missing expected DataType attribute.');
  });

  return (target) => {
    return {
      Message: event.message,
      MessageAttributes: event.attributes,
      TargetArn: target
    };
  };
};
