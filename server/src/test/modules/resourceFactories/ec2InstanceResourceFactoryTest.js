/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const inject = require('inject-loader!../../../modules/resourceFactories/ec2InstanceResourceFactory');
require('should');
let sinon = require('sinon');
let Instance = require('../../../models/Instance');

function createFixture({
  childAccountClientFake = { createEC2Client() { return Promise.resolve(); } },
  InstanceResourceBaseFake = {}
}) {
  return inject({
    '../amazon-client/childAccountClient': childAccountClientFake,
    './InstanceResourceBase': InstanceResourceBaseFake
  });
}

describe('ec2InstanceResourceFactory', function () {
  describe('all', function () {
    it('returns an instance of Instance for each machine', function () {
      const InstanceResourceBaseFake = function InstanceResourceBase() {
        this.all = function all() { return Promise.resolve([{}, {}]); };
      };
      const sut = createFixture({ InstanceResourceBaseFake });
      return sut.create()
        .then(instanceResource => instanceResource.all())
        .should.finally.matchEach(i => i.should.be.instanceOf(Instance));
    });
  });
  describe('setTag', function () {
    it('calls setTag on the machine', function () {
      const setTag = sinon.stub();
      const InstanceResourceBaseFake = function InstanceResourceBase() {
        this.setTag = setTag;
      };
      const sut = createFixture({ InstanceResourceBaseFake });
      const expectedArg = {};
      return sut.create()
        .then(instanceResource => instanceResource.setTag(expectedArg))
        .then(() => sinon.assert.calledWith(setTag, sinon.match.same(expectedArg)));
    });
  });
});
