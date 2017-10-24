/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon = require('sinon');
let rewire = require('rewire');
let deploymentMonitor = rewire('modules/monitoring/DeploymentMonitor');
let NodeDeploymentStatus = require('../../Enums').NodeDeploymentStatus;
let Enums = require('../../Enums');

describe('DeploymentMonitor', () => {

  describe('detectNodesDeploymentsStatus()', () => {

    let fn = deploymentMonitor.__get__('detectNodesDeploymentStatus');

    it('for successful nodes', () => {
      var result = fn([
        {
          Status: NodeDeploymentStatus.Success
        },
        {
          Status: NodeDeploymentStatus.Success
        }
      ]);
      result.name.should.equal(Enums.DEPLOYMENT_STATUS.Success);
      result.reason.should.be.type('string');
    });


    it('for nodes in progress', () => {

      var result = fn([
        {
          Status: NodeDeploymentStatus.InProgress
        },
        {
          Status: NodeDeploymentStatus.Success
        }
      ]);
      result.name.should.equal(Enums.DEPLOYMENT_STATUS.InProgress);
    });


    it('for failed nodes', () => {
      var result = fn([
        {
          Status: NodeDeploymentStatus.Failed
        },
        {
          Status: NodeDeploymentStatus.Success
        }
      ]);
      result.name.should.equal(Enums.DEPLOYMENT_STATUS.Failed);
      result.reason.should.be.equal('Deployment failed: deployed 1/2 nodes');

      result = fn([
        {
          Status: NodeDeploymentStatus.Failed
        },
        {
          Status: NodeDeploymentStatus.Failed
        }
      ]);

      result.name.should.equal(Enums.DEPLOYMENT_STATUS.Failed);
      result.reason.should.be.equal('Deployment failed: deployed 0/2 nodes');

    });

  });

});

