/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let servicesDb = require('modules/data-access/services');

class Service {

  constructor(data) {
    _.assign(this, data);
  }

  static getByName(name) {
    return servicesDb.get({ ServiceName: name })
      .then(obj => (obj ? new Service(obj) : null));
  }
}

module.exports = Service;
