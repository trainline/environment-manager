/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let validUrl = require('valid-url');
let _ = require('lodash');

let sender = require('modules/sender');
let adapt = require('modules/callbackAdapter');
let route = require('modules/helpers/route');
let RequestData = require('modules/RequestData');

let Enums = require('Enums');
let SupportedSliceNames = _.values(Enums.SliceName);
let SupportedDeploymentModes = _.values(Enums.DeploymentMode);
let deployAuthorizer = require('modules/authorizers/deploy-authorizer');

module.exports = route.post('/:account/environments/:environment/services/:service/:version/deploy')
  .inOrderTo('Deploy a particular service version by provisioning the infrastructure and uploading the package on S3.')
  .withDocs({
    description: 'Deploy',
    tags: ['Deployments'],
    params: [
      { in: ['query', 'body'], type: 'string', required: true, name: 'Mode', description: 'Todo: Describe "Mode" parameter' },
      { in: ['query', 'body'], type: 'string', required: true, name: 'Slice', description: 'Todo: Describe "Slice" parameter' },
      { in: ['query', 'body'], type: 'string', required: true, name: 'PackagePath', description: 'Todo: Describe "PackagePath" parameter' },
      { in: ['query'], type: 'string', required: false, name: 'server_role', description: 'Target server role for service deployment, if multiple are possible' },
    ],
  })
  .withAuthorizer(deployAuthorizer)
  .do((request, response) => {

    let requestData = new RequestData(request);

    let deploymentMode = requestData.get('Mode', 'overwrite').toLowerCase();
    let serviceSlice = requestData.get('Slice', 'none').toLowerCase();
    let packagePath = requestData.get('PackagePath');

    if (SupportedDeploymentModes.indexOf(deploymentMode.toLowerCase()) < 0) {
      response.status(400);
      response.send(`Unknown mode "${deploymentMode}". Supported modes are: ${SupportedDeploymentModes.join(', ')}`);
      return;
    }

    if (deploymentMode === 'bg' && SupportedSliceNames.indexOf(serviceSlice) < 0) {
      response.status(400);
      response.send(`Unknown slice name "${serviceSlice}". Supported slice names are: ${SupportedSliceNames.join(', ')}`);
      return;
    }

    if (!packagePath) {
      response.status(400);
      response.send(`Missing "packagePath" argument.`);
      return;
    }

    var packageType = validUrl.isUri(packagePath) ?
      Enums.SourcePackageType.CodeDeployRevision :
      Enums.SourcePackageType.DeploymentMap;

    var command = {
      name: 'DeployService',
      accountName: request.params.account,
      environmentName: request.params.environment,
      serviceName: request.params.service,
      serviceVersion: request.params.version,
      serviceSlice,
      packageType,
      packagePath,
      serverRoleName: request.serverRoleName,
    };

    //Location
    var callback = adapt.callbackToExpress(request, response);

    sender.sendCommand({ command: command, user: request.user }).then(
      deployment => {
        response.status(201);
        response.location(`/api/${deployment.accountName}/deployments/history/${deployment.id}`);
        callback(null, deployment);
      },

      error => {
        callback(error);
      }
    );

  });
