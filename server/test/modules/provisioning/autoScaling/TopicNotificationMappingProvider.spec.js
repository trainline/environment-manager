/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');

let DeploymentContract = require('modules/deployment/DeploymentContract');
let AutoScalingNotificationType = require('Enums').AutoScalingNotificationType;

describe('TopicNotificationMappingProvider:', () => {

  var expectedTopic = {
    TopicArn: 'arn:aws:sns:eu-west-1:000000000001:InfraAsgLambdaScale',
  };

  var senderMock = {
    sendQuery: sinon.stub().returns(Promise.resolve(expectedTopic)),
  };

  const accountName = 'Prod';

  var promise = null;

  before(() => {

    var target = proxyquire(
      'modules/provisioning/autoScaling/topicNotificationMappingProvider', { 'modules/sender': senderMock }
    );
    promise = target.get(accountName);

  });

  it("should be possible to detect the 'InfraAsgLambdaScale' Topic Arn", () =>

    promise.then(() => {

      senderMock.sendQuery.called.should.be.true();
      senderMock.sendQuery.getCall(0).args[0].should.match({
        query: {
          name: 'GetTopic',
          accountName: accountName,
          topicName: 'InfraAsgLambdaScale',
        },
      });

    })

  );

  it('should be possible to obtain a mapping', () =>

    promise.then(mapping => {

      should(mapping).not.be.undefined();
      should(mapping).be.Array();
      mapping.should.match([{
        topicName: 'InfraAsgLambdaScale',
        topicArn: expectedTopic.TopicArn,
        notificationTypes: [
          AutoScalingNotificationType.InstanceLaunch,
          AutoScalingNotificationType.InstanceLaunchError,
          AutoScalingNotificationType.InstanceTerminate,
          AutoScalingNotificationType.InstanceTerminateError,
        ],
      },]);

    })

  );

});

