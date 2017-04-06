/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const createTopic = require('./createTopic');
const getTargetArn = require('./getTargetArn');
const createEvent = require('./createEvent');
const publishEvent = require('./publishEvent');

/**
 * @param {any} event
 *
 * event: {
 *  topic: 'string' = topic name,
 *  message: 'string' = message content,
 *  attributes: 'object' = {
 *    key: 'object' = {
 *      DataType: 'string' = 'String',
 *      StringValue: 'string' = 'Value of the attribute'
 *    }
 *  }
 * }
 *
 * Valid topics:
 * EnvironmentManagerConfigurationChange
 *  optional extras for the topic: EnvironmentManagerConfigurationChange/somethingElse/SomethingElse
 * EnvironmentManagerOperationsChange
 *  optional extras for the topic: EnvironmentManagerOperationsChange/somethingElse/SomethingElse
 *
 * Valid keys for attributes:
 *  'EnvironmentType',
    'Environment',
    'OwningCluster',
    'User',
    'Result',
    'Timestamp',
    'Action',
    'ID',
    'EntityURL'
 *
 * Example use:
 * sns.publish({
 *  topic: 'EnvironmentManagerConfigurationChange',
 *  message: 'This is what will be sent as message content to the consumer',
 *  attributes: {
 *    ID: {
 *      DataType: 'String',
 *      StringValue: 'ThisIsMyIdValue'
 *    }
 *  }
 * })
 */
exports.publish = (event) => {
  createTopic(event.topic)
    .then(getTargetArn)
    .then(createEvent(event))
    .then(publishEvent)
    .catch((reason) => {
      console.log(reason);
    });
};

exports.TOPICS = {
  CONFIGURATION_CHANGE: 'EnvironmentManagerConfigurationChange',
  OPERATIONS_CHANGE: 'EnvironmentManagerOperationsChange'
};

exports.ACTIONS = {
  DELETE: 'delete',
  REMOVE: 'delete',
  UPDATE: 'update',
  PUT: 'update',
  CREATE: 'create',
  POST: 'create'
};
