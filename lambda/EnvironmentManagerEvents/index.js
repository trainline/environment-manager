/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const AWS = require("aws-sdk");
const createTopic = require('./createTopic');
const getTargetArn = require('./getTargetArn');
const createEvent = require('./createEvent');
const publishEvent = require('./publishEvent');
const respond = require('./respond').respond;
const fail = require('./respond').fail;

exports.handler = (event, context) =>
    createTopic(event.topic)
        .then(getTargetArn)
        .then(createEvent(event))
        .then(publishEvent)
        .then(respond(context))
        .catch(fail(context));
