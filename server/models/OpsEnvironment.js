/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let config = require('config');
let cronService = require('modules/cronService')();
let sender = require('modules/sender');
let ScanDynamoResources = require('queryHandlers/ScanDynamoResources');

class OpsEnvironment {
  
  constructor(data) {
    _.assign(this, data);
  }

  getScheduleStatus(date) {
    let env = this.Value;
    if (env.ScheduleAutomatically) {
      let schedule = cronService.getActionBySchedule(env.DefaultSchedule, date);
      return schedule ? schedule : 'ON';
    }

    return env.ManualScheduleUp ? 'ON' : 'OFF';
  }

  toAPIOutput() {
    let ret = {
      EnvironmentName: this.EnvironmentName,
      Value: _.pick(this.Value, 'ManualScheduleUp', 'ScheduleAutomatically')
    };

    ret.Value.ScheduleStatus = this.getScheduleStatus();
    return ret;
  }

  static getAll(filter={}) {
    const masterAccountName = config.getUserValue('masterAccountName');

    return ScanDynamoResources({ resource: 'ops/environments', filter, exposeAudit: 'version-only', accountName: masterAccountName })
      .then((list) => list.map(env => new OpsEnvironment(env)));
  }

  static getByName(environmentName) {
    const masterAccountName = config.getUserValue('masterAccountName');
    
    let childQuery = {
      name: 'GetDynamoResource',
      resource: 'ops/environments',
      key: environmentName,
      accountName: masterAccountName,
    };

    return sender.sendQuery({ query: childQuery }).then((obj) => new OpsEnvironment(obj));;
  }
}

module.exports = OpsEnvironment;