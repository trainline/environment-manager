/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = {
  create(parameters) {
    let resourceProvider = require('modules/resourceProvider');
    return resourceProvider.getInstanceByName('instances', parameters);
  }
};
