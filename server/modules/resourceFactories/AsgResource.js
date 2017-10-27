/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let AsgResourceBase = require('./AsgResourceBase');
let AutoScalingGroup = require('../../models/AutoScalingGroup');

function AsgResource(accountId) {
  const base = new AsgResourceBase(accountId);
  const self = Object.create(new AsgResourceBase(accountId));
  self.get = function (parameters) {
    return base.get(parameters).then(x => new AutoScalingGroup(x));
  };
  self.all = function (parameters) {
    return base.all(parameters).then(xs => xs.map(x => new AutoScalingGroup(x)));
  };
  return self;
}

module.exports = AsgResource;
