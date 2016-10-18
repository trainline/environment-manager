/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let sender = require('modules/sender');
let adapt = require('modules/callbackAdapter');
let environmentProtection = require('modules/authorizers/environmentProtection');

let scheduleStatusRoute =
  route.get('/environments/:environment/schedule-status')
    .inOrderTo('Get the current schedule status of an Environment')
    .withDocs({
      description: 'Environment',
      tags: ['Environments'],
    })
    .do((request, response) => {
      let query = {
        name: 'GetEnvironmentScheduleStatus',
        environmentName: request.params.environment,
      };
      send.query(query, request, response);
    });

let timedScheduleStatusRoute =
  route.get('/environments/:environment/schedule-status/:date')
    .inOrderTo('Get the schedule status of an Environment at a particular date/time')
    .withDocs({
      description: 'Environment',
      tags: ['Environments'],
    })
    .do((request, response) => {
      let query = {
        name: 'GetEnvironmentScheduleStatus',
        environmentName: request.params.environment,
        date: request.params.date,
      };
      send.query(query, request, response);
    });


let accountLookupRoute =
  route.get('/environments/:environment/accountName')
    .inOrderTo('Get the account name associated with the given environment')
    .withDocs({ description: 'Environment', tags: ['Environments'] })
    .do((request, response) => {
      let callback = adapt.callbackToExpress(request, response);
      let success = result => callback(null, result);
      let failure = error => callback(error);
      let command = {
        name: 'GetAccountByEnvironment',
        environment: request.params.environment,
      };
      sender.sendCommand({ command, user: request.user }).then(success, failure);
    });

let protectedActionRoute =
  route.get('/environments/:environment/protected')
    .inOrderTo('Do something')
    .withDocs({ description: 'Environment', tags: ['Environments'] })
    .do((request, response) => {
      let environment = request.params.environment;
      let action = request.query.action;
      environmentProtection.isActionProtected(environment, action)
        .then(isProtected => response.json({ isProtected }));
    });

module.exports = [
  scheduleStatusRoute,
  timedScheduleStatusRoute,
  accountLookupRoute,
  protectedActionRoute,
];
