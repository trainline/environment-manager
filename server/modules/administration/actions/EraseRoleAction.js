/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let KeyValueStoreEraser = require('modules/administration/services/KeyValueStoreEraser');

function EraseRoleAction(environmentName) {
  let keyValueStoreEraser = new KeyValueStoreEraser(environmentName);

  function fromTagsListToObject(tags) {
    let result = {};

    tags.forEach(tag => {
      let segments = tag.split(':');
      let key = segments[0];
      let value = segments[1];

      result[key] = value;
    });

    return result;
  }

  this.do = function (roleName) {
    return co(function* () {
      let validRoleNames = [roleName, `${roleName}-blue`, `${roleName}-green`];

      let keyPrefix = `environments/${environmentName}/roles/${roleName}`;
      let condition = (key) => {
        let keySegments = key.split('/');
        let keyRoleName = keySegments[3];
        return (validRoleNames.indexOf(keyRoleName) >= 0);
      };

      let erasedRolesKeys = yield keyValueStoreEraser.scanAndDelete({ keyPrefix, condition });
      let serviceInstallationKeysToErase = [];

      let erasedServicesDefinitionKeys = yield keyValueStoreEraser.scanAndDelete({
        keyPrefix: `environments/${environmentName}/services/`,
        condition: (key, value) => {
          if (!value) return false;
          if (!value.Service) return false;
          if (!value.Service.Tags) return false;

          let tags = fromTagsListToObject(value.Service.Tags);
          if (validRoleNames.indexOf(tags.server_role) < 0) return false;

          let keySegments = key.split('/');
          keySegments.pop();
          let keysToErase = `${keySegments.join('/')}/installation`;
          serviceInstallationKeysToErase.push(keysToErase);
          return true;
        },
      });

      let erasedServicesInstallationKeys = yield keyValueStoreEraser.scanAndDelete({
        keyPrefix: `environments/${environmentName}/services/`,
        condition: (key) => serviceInstallationKeysToErase.indexOf(key) >= 0,
      });

      let result = erasedServicesDefinitionKeys
        .concat(erasedServicesInstallationKeys)
        .concat(erasedRolesKeys);

      return result;
    });
  };
}

module.exports = EraseRoleAction;
