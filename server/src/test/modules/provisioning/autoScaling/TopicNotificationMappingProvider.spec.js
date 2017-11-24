/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let should = require('should');
let sinon = require('sinon');
const inject = require('inject-loader!../../../../modules/provisioning/autoScaling/topicNotificationMappingProvider');
let AutoScalingNotificationType = require('../../../../Enums').AutoScalingNotificationType;

describe('TopicNotificationMappingProvider:', () => {
  let expectedTopic = {
    TopicArn: 'arn:aws:sns:eu-west-1:000000000001:InfraAsgLambdaScale'
  };

  let senderMock = {
    sendQuery: sinon.stub().returns(Promise.resolve(expectedTopic))
  };

  const accountName = 'Prod';

  let promise = null;

  before(() => {
    let target = inject({ '../../sender': senderMock });
    promise = target.get(accountName);
  });

  it('should be possible to detect the \'InfraAsgLambdaScale\' Topic Arn', () =>

    promise.then(() => {
      senderMock.sendQuery.called.should.be.true();
      senderMock.sendQuery.getCall(0).args[1].should.match({
        query: {
          name: 'GetTopic',
          accountName,
          topicName: 'InfraAsgLambdaScale'
        }
      });
    })

  );

  it('should be possible to obtain a mapping', () =>

    promise.then((mapping) => {
      should(mapping).not.be.undefined();
      should(mapping).be.Array();
      mapping.should.match([{
        topicName: 'InfraAsgLambdaScale',
        topicArn: expectedTopic.TopicArn,
        notificationTypes: [
          AutoScalingNotificationType.InstanceLaunch,
          AutoScalingNotificationType.InstanceLaunchError,
          AutoScalingNotificationType.InstanceTerminate,
          AutoScalingNotificationType.InstanceTerminateError
        ]
      }]);
    })

  );
});

