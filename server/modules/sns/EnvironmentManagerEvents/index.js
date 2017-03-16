/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const createTopic = require('./createTopic');
const getTargetArn = require('./getTargetArn');
const createEvent = require('./createEvent');
const publishEvent = require('./publishEvent');

exports.publish = (event) => {
  createTopic(event.topic)
    .then(getTargetArn)
    .then(createEvent(event))
    .then(publishEvent)
    .catch((reason) => {
      console.log(reason);
    });
};
