/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let KeyValueStoreEraser = require('modules/administration/services/KeyValueStoreEraser');

function EraseServiceVersionAction(environmentName) {
  let keyValueStoreEraser = new KeyValueStoreEraser(environmentName);

  this.do = function (serviceName, serviceVersion) {
    return co(function* () {
      let erasedServicesKeys = yield keyValueStoreEraser.scanAndDelete({
        keyPrefix: `environments/${environmentName}/services/${serviceName}/${serviceVersion}/`,
        condition: () => true
      });

      let erasedRolesKeys = yield keyValueStoreEraser.scanAndDelete({
        keyPrefix: `environments/${environmentName}/roles/`,
        condition: (key, value) => { return value ? value.Name === serviceName && value.Version === serviceVersion : false; }
      });

      return erasedServicesKeys.concat(erasedRolesKeys);
    });
  };
}

module.exports = EraseServiceVersionAction;
