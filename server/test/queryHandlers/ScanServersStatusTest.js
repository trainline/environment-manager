/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let sinon = require('sinon');
let rewire = require('rewire');
let assert = require('assert');

describe('ScanServersStatus', function() {

  const MOCK_ENVIRONMENT = 'test-env';
  const RUNNING_INSTANCE = 'running-instance';
  const TERMINATED_INSTANCE = 'terminated-instance';
  const RUNNING_INSTANCE_SERVICE = 'running-instance-service';
  const TERMINATED_INSTANCE_SERVICE = 'terminated-instance-service';

  let mockInstance_1 = {
    InstanceId: 22,
    ImageId: 44,
    Tags: [{Key:'Name', Value:RUNNING_INSTANCE}],
    State: {
      Name: 'running'
    }
  };

  let mockInstance_2 = {
    InstanceId: 55,
    ImageId: 44,
    Tags: [{Key:'Name', Value:TERMINATED_INSTANCE}],
    State: {
      Name: 'running'
    }
  };

  let mockImage = {
    IsLatest: true,
    IsStable: true,
    ImageId: 44,
    Name: 'testAMI-abc123',
    CreationDate: new Date('02/02/2016').toISOString()
  };

  let mockAsg = {
    getTag: sinon.stub().returns(MOCK_ENVIRONMENT),
    getServerRoleName: sinon.stub(),
    getRuntimeServerRoleName: sinon.stub(),
    Instances:[mockInstance_1, mockInstance_2]
  };

  let mockServices = {
    [RUNNING_INSTANCE]: {
      Services: {
        service1: {Service: RUNNING_INSTANCE_SERVICE, Tags:[]}
      }
    },
    [TERMINATED_INSTANCE]: {
      Services: {
        service2: {Service: TERMINATED_INSTANCE_SERVICE, Tags:[]}
      }
    }
  };

  let sender = {
    sendQuery: function(value) {
      let query = value.query;
      switch(query.name) {
        case 'ScanCrossAccountInstances':
          return Promise.resolve([mockInstance_1, mockInstance_2]);
          break;
        case 'ScanCrossAccountImages':
          return Promise.resolve([mockImage]);
          break;
        case 'GetNode':
          return Promise.resolve(mockServices[query.nodeName]);
          break;
        default:
          throw Error('Unknown Query');
          break;
      }
    }
  };

  let Environment = {
    getAccountNameForEnvironment: function () {
      return Promise.resolve();
    }
  };

  let AutoScalingGroupMock = {
    getAllByEnvironment: function () {
      return [mockAsg];
    }
  };

  let sut;
  let query = {
    environmentName: MOCK_ENVIRONMENT,
    filter: {
      cluster: undefined
    },
  };

  beforeEach(() => {
    sut = rewire('queryHandlers/ScanServersStatus');
    sut.__set__({
      sender,
      Environment,
      AutoScalingGroup: AutoScalingGroupMock
    });

  });

  describe('When all ASGs are running', () => {
    it('all services should be returned', () => {
      return sut(query).then(result => {
        let services = result.Value[0].Services;
        assert.equal(services.length, 2)
      });
    })
  });

  describe('ASGs that are terminated', () => {
    beforeEach(() => mockInstance_2.State.Name = 'terminated');

    it('should have their services ignored', () => {
      return sut(query).then(result => {
        let services = result.Value[0].Services;
        assert.equal(services.length, 1);
        assert.equal(services[0].Name, RUNNING_INSTANCE_SERVICE);
      });
    });
  });

  describe('ASGs with the latest but unstable images', () => {
    beforeEach(() => {
      mockImage.IsLatest = true;
      mockImage.IsStable = false;
    });

    it('should not be marked as latest stable', () => {
      return sut(query).then(result => {
        let ami = result.Value[0].Ami;
        assert.equal(ami.IsLatestStable, false);
      });
    });
  });

  describe('ASGs with stable but stale images', () => {
    beforeEach(() => {
      mockImage.IsLatest = false;
      mockImage.IsStable = true;
    });

    it('should not be marked as latest stable', () => {
      return sut(query).then(result => {
        let ami = result.Value[0].Ami;
        assert.equal(ami.IsLatestStable, false);
      });
    });
  });

  describe('ASGs with the latest, stable images', () => {
    beforeEach(() => {
      mockImage.IsLatest = true;
      mockImage.IsStable = true;
    });

    it('should be marked as latest stable', () => {
      return sut(query).then(result => {
        let ami = result.Value[0].Ami;
        assert.equal(ami.IsLatestStable, true);
      });
    });
  });
});
