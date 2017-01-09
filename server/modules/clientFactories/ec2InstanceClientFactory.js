/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = {
  create: function (parameters) {
    let resourceProvider = require('modules/resourceProvider');
    return resourceProvider.getInstanceByName('instances', parameters);
  },
};
