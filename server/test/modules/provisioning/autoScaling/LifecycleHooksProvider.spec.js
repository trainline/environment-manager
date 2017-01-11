/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require("should");
let sinon = require("sinon");
let proxyquire = require('proxyquire');

let LifecycleHookType = require("Enums").LifecycleHookType;
let LifecycleHookDefaultResult = require("Enums").LifecycleHookDefaultResult;

describe("LifecycleHooksProvider: ", () => {

  var accountName = "Prod";

  var expectedIAMRole = {
    RoleName: "roleInfraAsgScale",
    Arn: "arn:aws:iam::000000000001:role/roleInfraAsgScale"
  };

  var expectedTopic = {
    TopicArn: "arn:aws:sns:eu-west-1:000000000001:InfraAsgLambdaScale"
  };

  var senderMock = {
    sendQuery: sinon.stub()
  };

  const lifecycleHooksProvider = proxyquire(
    'modules/provisioning/autoScaling/lifecycleHooksProvider',
    {'modules/sender': senderMock}
  );

  senderMock.sendQuery.withArgs(sinon.match({ query: { name: "GetRole" } }))
    .returns(Promise.resolve(expectedIAMRole));

  senderMock.sendQuery.withArgs(sinon.match({ query: { name: "GetTopic" } }))
    .returns(Promise.resolve(expectedTopic));

  var promise;

  before(() => {
    var target = lifecycleHooksProvider;
    promise = target.get(accountName);
  });

  it("should be possible to obtain a lifecycle hook", () => {

    return promise.then(lifecycleHooks => {

      should(lifecycleHooks).not.be.undefined();
      should(lifecycleHooks).be.Array();

      lifecycleHooks[0].should.match({
        name: "10min-draining",
        type: LifecycleHookType.InstanceTerminating,
        roleArn: expectedIAMRole.Arn,
        topicArn: expectedTopic.TopicArn,
        defaultResult: LifecycleHookDefaultResult.Continue,
        heartbeatTimeout: "10m"
      });

    });

  });  

  it("should be possible to obtain the roleInfraAsgScale Role Arn", () =>

    promise.then(() => {

      senderMock.sendQuery.called.should.be.true();
      senderMock.sendQuery.getCall(0).args[0].should.match({
        query: {
          name: "GetRole",
          accountName: accountName,
          roleName: "roleInfraAsgScale"
        }
      });

    })

  );

  it("should be possible to obtain the InfraAsgLambdaScale Topic Arn", () =>

    promise.then(() => {

      senderMock.sendQuery.called.should.be.true();
      senderMock.sendQuery.getCall(1).args[0].should.match({
        query: {
          name: "GetTopic",
          accountName: accountName,
          topicName: "InfraAsgLambdaScale"
        }
      });

    })

  );

});