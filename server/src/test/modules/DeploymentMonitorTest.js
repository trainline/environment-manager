/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

require('should');
let inject = require('inject-loader!../../modules/monitoring/DeploymentMonitor');
let NodeDeploymentStatus = require('../../Enums').NodeDeploymentStatus;
let Enums = require('../../Enums');

describe('DeploymentMonitor', () => {
  let deploymentMonitor = inject();
  describe('detectNodesDeploymentsStatus()', () => {
    let fn = deploymentMonitor.detectNodesDeploymentStatus;

    it('for successful nodes', () => {
      let result = fn([
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
      let result = fn([
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
      let result = fn([
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

