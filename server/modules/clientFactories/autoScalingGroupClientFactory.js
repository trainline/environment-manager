/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const asgResourceFactory = require('../../modules/resourceFactories/asgResourceFactory');

module.exports = {
  create(parameters) {
    return asgResourceFactory.create(undefined, parameters);
  }
};
