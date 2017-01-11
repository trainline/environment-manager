/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let consulUpdater = require('./consul');

/**
 * Service Discovery abstraction to allow easy switching
 * of service discovery frameworks.
 */
module.exports = consulUpdater;
