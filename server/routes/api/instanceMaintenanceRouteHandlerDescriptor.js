/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let route = require('modules/helpers/route');
let callbackAdapter = require('modules/callbackAdapter');
let sender = require('modules/sender');
let logger = require('modules/logger');
let simpleAuthorizer = require('modules/authorizers/simple');

module.exports =
  route.post('/:account/instances/:instanceId/maintenance')
  .withAuthorizer(simpleAuthorizer)
  .withDocs({
    description: 'Instance',
    verb: 'scan',
    tags: ['Instances']
  })
  .do((request, response) => {
    let promise = co(function* () {
      let accountName = request.params.account;
      let instanceId = request.params.instanceId;
      let enable = request.body.enable;

      if (enable === undefined) {
        throw new Error('\'enable\' JSON param needs to be specified');
      }

      let query = {
        name: 'ScanInstances',
        accountName,
        filter: {
          'instance-id': instanceId
        }
      };

      let instances = yield sender.sendQuery({ query });
      if (instances.length !== 1) {
        throw new Error(`Expected 1 instance with id ${instanceId}, found ${instances.length}`);
      }

      let instance = instances[0];
      let name = 'SetInstanceMaintenanceMode';
      let user = request.user;
      let command = {
        name,
        instance,
        accountName,
        enable
      };

      return sender.sendCommand({ command, user }).then(() => {
        let switchString = enable ? 'enabled' : 'disabled';
        logger.info(`Consul maintenance mode ${switchString} for ${instanceId}`);
        return { ok: true };
      });
    });

    callbackAdapter.promiseToExpress(request, response)(promise);
  });
