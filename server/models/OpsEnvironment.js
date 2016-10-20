/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let config = require('config');
let cronService = require('modules/cronService')();

class OpsEnvironment {
  
  constructor(data) {
    _.assign(this, data);
  }

  getSchedule(date) {
    let env = this.Value;
    if (env.ScheduleAutomatically) {
      let schedule = cronService.getActionBySchedule(env.DefaultSchedule, date);
      return schedule ? schedule : 'ON';
    }

    return env.ManualScheduleUp ? 'ON' : 'OFF';
  }

  static getByName(environmentName) {
    const masterAccountName = config.getUserValue('masterAccountName');
    
    let sender = require('modules/sender');
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