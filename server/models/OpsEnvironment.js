/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let scheduling = require('modules/scheduling');
let Environment = require('models/Environment');
let co = require('co');
let opsEnvironment = require('modules/data-access/opsEnvironment');

class OpsEnvironment {

  constructor(data) {
    _.assign(this, data);
  }

  getScheduleStatus(date) {
    let env = this.Value;
    return scheduling.expectedStateFromSchedule(env, date).toUpperCase();
  }

  toAPIOutput() {
    let self = this;
    return co(function* () {
      let value = _.pick(self.Value, 'ManualScheduleUp', 'ScheduleAutomatically', 'DeploymentsLocked');
      value.InMaintenance = self.Value.EnvironmentInMaintenance;

      let accountName = yield Environment.getAccountNameForEnvironment(self.EnvironmentName);
      value.AccountName = accountName;

      let ret = {
        EnvironmentName: self.EnvironmentName,
        Value: value
      };

      ret.Value.ScheduleStatus = self.getScheduleStatus();
      return ret;
    });
  }

  static getAll(filter = {}) {
    return opsEnvironment.scan()
      .then(list => list.map(env => new OpsEnvironment(env)));
  }

  static getByName(environmentName) {
    return opsEnvironment.get({ EnvironmentName: environmentName })
      .then(obj => new OpsEnvironment(obj));
  }
}

module.exports = OpsEnvironment;
