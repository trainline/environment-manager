/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon = require('sinon');

let ConsulManager = require('modules/service-targets/consul/ConsulManager');

describe(`ConsulManager:`, () => {
  let consulClientMock;
  let consulManager;

  beforeEach('Bootstapping mocks', () => {

    consulClientMock = {
      agent: {
        maintenance: sinon.stub().callsArgWith(1, undefined),
      },
    };

    consulManager = new ConsulManager(consulClientMock);
  });

  it('disables server given the ip', function () {

    return consulManager.setServerMaintenanceMode(true).then(() => {

      consulClientMock.agent.maintenance.calledOnce.should.be.true();
      consulClientMock.agent.maintenance.getCall(0).args[0].should.match({
        enable: true,
      });

    });

  });

});
