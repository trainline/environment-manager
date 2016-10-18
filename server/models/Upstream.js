/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const RESOURCE = 'config/lbupstream';
let _ = require('lodash');
let GetDynamoResource = require('queryHandlers/GetDynamoResource');

class Upstream {
  
  constructor(data) {
    _.assign(this, data);
  }

  getEnvironmentName() {
    return this.Value.EnvironmentName;
  }

  static getByKey(name) {
    GetDynamoResource({ resource: RESOURCE, key: name }).then(data => new Upstream(data));
  }

  static getByName(name) {
    GetDynamoResource({ resource: RESOURCE, key: name }).then(data => new Upstream(data));
  }
}

module.exports = Environment;