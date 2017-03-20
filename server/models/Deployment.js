/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let deploymentsHelper = require('modules/queryHandlersUtil/deployments-helper');
let systemUser = require('modules/systemUser');
let sender = require('modules/sender');

class Deployment {

  constructor(data, expectedNodes = undefined) {
    _.assign(this, data);
    if (expectedNodes !== undefined) {
      this.ExpectedNodes = expectedNodes;
    }
  }

  static getById(key) {
    return deploymentsHelper.get({ key });
  }

  updateItemValue(itemValue) {
    let command = {
      name: 'UpdateDynamoResource',
      resource: 'deployments/history',
      accountName: this.AccountName,
      key: this.DeploymentID,
      item: itemValue
    };
    return sender.sendCommand({ command, user: systemUser });
  }

  addExecutionLogEntries(logs) {
    let executionLog = this.Value.ExecutionLog;
    let executionLogEntries = executionLog ? executionLog.split('\n') : [];
    executionLogEntries = executionLogEntries.concat(logs);

    this.Value.ExecutionLog = executionLogEntries.join('\n');

    return this.updateItemValue({
      'Value.ExecutionLog': this.Value.ExecutionLog
    });
  }

}

module.exports = Deployment;
