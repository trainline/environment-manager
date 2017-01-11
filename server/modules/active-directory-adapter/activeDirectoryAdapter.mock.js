/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

module.exports = function ActiveDirectoryAdapter() {
  this.configure = () => { };

  this.authorizeUser = (credentials, mainCallback) => {
    let roles = [];

    switch (credentials.username) {
      case 'jbloggs':
        roles.push('GG-APP-EnvironmentManager-Test');
        break;

      case 'tuser':
        roles.push('GG-APP-EnvironmentManager-Test');
        roles.push('GG-APP-EnvironmentManager-Test2');
        break;

      default:
        roles.push('GG-APP-EnvironmentManager-Editor');
        break;
    }

    let name = credentials.username.toLowerCase();
    mainCallback(null, { name, roles });
  };
};
