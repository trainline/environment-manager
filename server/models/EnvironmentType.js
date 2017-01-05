/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let environmentDatabase = require('modules/environmentDatabase');

class EnvironmentType {
  
  constructor(data) {
    _.assign(this, data);
  }

  static getByName(name) {
    return environmentDatabase.getEnvironmentTypeByName(name);
  } 
  
}

module.exports = EnvironmentType;
