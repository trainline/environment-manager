/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').factory('environmentDeploy',
  function () {
    var deployHandler;

    function registerDeployHandler(handler) {
      deployHandler = handler;
    }

    function destroyHandler() {
      deployHandler = null;
    }

    function callDeployHandler() {
      deployHandler();
    }

    return {
      registerDeployHandler: registerDeployHandler,
      callDeployHandler: callDeployHandler,
      destroyHandler: destroyHandler
    }
  }
);

