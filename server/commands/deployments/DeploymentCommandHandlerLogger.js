/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let logger = require('modules/logger');
let deploymentLogger = require('modules/DeploymentLogger');

module.exports = function DeploymentCommandHandlerLogger(commandOrDeploymentId) {
  let deploymentId = (() => {
    if (typeof commandOrDeploymentId === 'string') {
      return commandOrDeploymentId;
    } else {
      return commandOrDeploymentId.deploymentId || commandOrDeploymentId.commandId;
    }
  })();

  this.debug = logger.debug.bind(logger);

  this.info = function (message) {
    logger.info(message);
    deploymentLogger.inProgress(deploymentId, message);
  };

  this.warn = function (message) {
    logger.warn(message);
    deploymentLogger.inProgress(deploymentId, message);
  };

  this.error = logger.error.bind(logger);
};
