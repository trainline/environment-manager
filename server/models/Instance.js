/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let taggable = require('./taggable');

class Instance {

  constructor(data) {
    _.assign(this, data);
  }

}

taggable(Instance);

module.exports = Instance;