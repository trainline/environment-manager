/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let resourceProvider = require('../resourceProvider');

module.exports = {
  create(parameters) {
    return resourceProvider.getInstanceByName('asgs', parameters);
  }
};
