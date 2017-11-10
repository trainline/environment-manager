'use strict';

let proxyquire = require('proxyquire').noCallThru();
require('should');
let sinon = require('sinon');

const MUT = '../../../commands/asg/SetAutoScalingGroupSchedule';

function createFixture({
  autoScalingGroupResourceFactory = { create() { return Promise.resolve({ setTag() { }, createScheduledAction() { } }); } }
}) {
  let fakes = {
    '../../modules/resourceFactories/asgResourceFactory': autoScalingGroupResourceFactory,
    '../../modules/resourceFactories/ec2InstanceResourceFactory': {},
    '../../models/AutoScalingGroup': {}
  };
  return proxyquire(MUT, fakes);
}

describe('SetAutoScalingGroupSchedule', function () {
  describe('When I set a schedule that resizes the auto scaling group', function () {
    context('and the auto scaling group has no pre-existing scheduled actions', function () {
      context('and I do not specify min and max sizes', function () {
        function setup() {
          let createScheduledAction = sinon.spy(() => Promise.resolve());
          let sut = createFixture({
            autoScalingGroupResourceFactory: {
              create() {
                return Promise.resolve({
                  setTag() { return Promise.resolve(); },
                  createScheduledAction,
                  describeScheduledActions() { return Promise.resolve([]); }
                });
              }
            }
          });
          return {
            createScheduledAction,
            sut
          };
        }
        it('the min size defaults to the desired size', function () {
          let { createScheduledAction, sut } = setup();
          return sut({
            schedule: [
              { MaxSize: 9, DesiredCapacity: 2, Recurrence: '0 8 * * 1,2,3,4,5' },
              { MaxSize: 9, DesiredCapacity: 3, Recurrence: '0 19 * * 1,2,3,4,5' }
            ]
          }).then(() => {
            sinon.assert.calledTwice(createScheduledAction);
            sinon.assert.calledWithMatch(createScheduledAction, {
              MinSize: 2
            });
            sinon.assert.calledWithMatch(createScheduledAction, {
              MinSize: 3
            });
          });
        });
        it('the max size defaults to the desired size', function () {
          let { createScheduledAction, sut } = setup();
          return sut({
            schedule: [
              { MinSize: 9, DesiredCapacity: 2, Recurrence: '0 8 * * 1,2,3,4,5' },
              { MinSize: 9, DesiredCapacity: 3, Recurrence: '0 19 * * 1,2,3,4,5' }
            ]
          }).then(() => {
            sinon.assert.calledTwice(createScheduledAction);
            sinon.assert.calledWithMatch(createScheduledAction, {
              MaxSize: 2
            });
            sinon.assert.calledWithMatch(createScheduledAction, {
              MaxSize: 3
            });
          });
        });
      });
    });
  });
});
