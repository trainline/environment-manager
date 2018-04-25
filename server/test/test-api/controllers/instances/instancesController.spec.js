'use strict';

/* eslint no-underscore-dangle: 0 */

const assert = require('assert');
const rewire = require('rewire');
const instancesController = rewire('../../../../api/controllers/instances/instancesController.js');

describe('Instances Controller', () => {
  let instance;
  let serviceTargets;
  let res;

  beforeEach(() => {
    instance = createInstance();
    serviceTargets = createServiceTargets();
    res = createRes();
    instancesController.__set__('Instance', instance);
    instancesController.__set__('sns', {
      publish: () => { }
    });
    instancesController.__set__('serviceTargets', serviceTargets);
  });

  describe('Maintenance Mode', () => {
    it('should do something', (done) => {
      instancesController.putInstanceMaintenance(createReq(), res, createNext())
        .then(() => {
          assert(instance.isPersistCalledWithCorrectArguments());
          assert(serviceTargets.setTargetStateCalledWithCorrectArguments());
          assert(res.sendCalledWithCorrectArguments());
          done();
        });
    });
  });
});

function createReq() {
  return {
    swagger: {
      params: {
        body: { value: { enable: true } },
        id: { value: 'ID_VALUE' }
      }
    }
  };
}

function createRes() {
  let sendCalled = false;

  return {
    sendCalledWithCorrectArguments() {
      return sendCalled;
    },
    send: (value) => {
      if (value.ok === true) {
        sendCalled = true;
      }
    }
  };
}

function createNext() {
  return () => { };
}

function createInstance() {
  let persistCalled = false;

  return {
    isPersistCalledWithCorrectArguments() {
      return persistCalled;
    },
    getById() {
      return Promise.resolve({
        persistTag(value) {
          if (value.key === 'Maintenance' && value.value === 'true') {
            persistCalled = true;
          }
          return Promise.resolve();
        },
        getTag() {
          return 'ENVIRONMENT_NAME';
        }
      });
    }
  };
}

function createServiceTargets() {
  let setTargetStateCalled = false;

  return {
    setTargetStateCalledWithCorrectArguments() {
      return setTargetStateCalled;
    },

    setTargetState(env, params) {
      if (env === 'ENVIRONMENT_NAME'
        && params.key === `nodes/${'ID_VALUE'}/cold-standby`
        && params.value === 'In Maintenance') {
        setTargetStateCalled = true;
      }
      return Promise.resolve();
    }
  };
}
