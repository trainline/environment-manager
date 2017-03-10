'use strict';

module.exports = (event) => {
  if (!event)
    throw new Error('Expected a configuration object when creating an event.');
  if (!event.message) 
    throw new Error('Missing expected message attribute.');

  for(let attr in event.attributes)
    if (!event.attributes[attr].DataType) 
      throw new Error('Missing expected DataType attribute.')

  return (target) => {
    return {
      Message: event.message,
      MessageAttributes: event.attributes,
      TargetArn: target
    };
  };
};