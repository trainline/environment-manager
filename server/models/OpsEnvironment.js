/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let config = require('config');
let cronService = require('modules/cronService')();
let sender = require('modules/sender');
let ScanDynamoResources = require('queryHandlers/ScanDynamoResources');
let Environment = require('models/Environment');
let co = require('co');

class OpsEnvironment {

  constructor(data) {
    _.assign(this, data);
  }

  getScheduleStatus(date) {
    let env = this.Value;
    if (env.ScheduleAutomatically) {
      let schedule = cronService.getActionBySchedule(env.DefaultSchedule, date);
      return schedule || 'ON';
    }

    return env.ManualScheduleUp ? 'ON' : 'OFF';
  }


  toAPIOutput() {
    let self = this;
    return co(function* () {
      let value = _.pick(self.Value, 'ManualScheduleUp', 'ScheduleAutomatically');

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
    const masterAccountName = config.getUserValue('masterAccountName');

    return ScanDynamoResources({ resource: 'ops/environments', filter, exposeAudit: 'version-only', accountName: masterAccountName })
      .then(list => list.map(env => new OpsEnvironment(env)));
  }

  static getByName(environmentName) {
    const masterAccountName = config.getUserValue('masterAccountName');

    let childQuery = {
      name: 'GetDynamoResource',
      resource: 'ops/environments',
      key: environmentName,
      accountName: masterAccountName
    };

    return sender.sendQuery({ query: childQuery }).then(obj => new OpsEnvironment(obj));
  }
}

module.exports = OpsEnvironment;
