/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let sender = require('modules/sender');
let awsAccounts = require('modules/awsAccounts');

class Service {

  constructor(data) {
    _.assign(this, data);
  }

  static getByName(name) {
    return awsAccounts.getMasterAccountName()
      .then((masterAccountName) => {
        let query = {
          name: 'ScanDynamoResources',
          resource: 'config/services',
          accountName: masterAccountName,
          filter: { ServiceName: name }
        };
        return sender.sendQuery({ query }).then(obj => new Service(obj));
      });
  }
}

module.exports = Service;
