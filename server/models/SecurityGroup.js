/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let sender = require('modules/sender');
let taggable = require('./taggable');

class SecurityGroup {

  constructor(data) {
    _.assign(this, data);
  }

  getName() {
    return this.getTag('Name');
  }

  static getAllByIds(accountName, vpcId, groupIds) {
    let query = {
      name: 'ScanSecurityGroups',
      accountName,
      vpcId,
      groupIds,
    };

    return sender.sendQuery({ query }).then(list => list.map(item => new SecurityGroup(item)));
  }

  static getAllByNames(accountName, vpcId, groupNames) {
    let query = {
      name: 'ScanSecurityGroups',
      accountName,
      vpcId,
      groupNames,
    };

    return sender.sendQuery({ query }).then(list => list.map(item => new SecurityGroup(item)));
  }

}

taggable(SecurityGroup);

module.exports = SecurityGroup;
