/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const expect = require('chai').expect;
const scheduling = require('../../../modules/scheduling');

describe('scheduling (auto scaling, cold-standbys)', () => {
  let scheduleTag = { Key: 'Schedule', Value: '247' };
  let environmentTag = { Key: 'Environment', Value: 'Any' };

  describe('skipping autoscaling actions', () => {
    let dateTime = '2016-10-21T15:57:00Z';
    scheduleTag.Value = 'stop: 27 16 21 10 * 2016';

    let asgModelWithOutEnvironmentTag = {
      Instances: [{
        InstanceId: 'instanceId',
        Tags: [scheduleTag],
        State: { Name: 'not-running-or-stopped' },
        AutoScalingGroup: {}
      }]
    };

    it('should skip if there is no "environment" tag', () => {
      let result = scheduling.actionsForAutoScalingGroup(asgModelWithOutEnvironmentTag, asgModelWithOutEnvironmentTag.Instances, dateTime);
      expect(result[0].action.action).to.equal(scheduling.actions.skip);
    });

    let asgModelThatIsTransitioning = {
      Instances: [{
        InstanceId: 'instanceId',
        Tags: [scheduleTag],
        State: { Name: 'not-running-or-stopped' },
        AutoScalingGroup: {}
      }],
      State: { Name: 'not-in-service-or-out-of-service' }
    };

    it('should skip if asg is "transitioning"', () => {
      let result = scheduling.actionsForAutoScalingGroup(asgModelThatIsTransitioning, asgModelWithInstancesTransitioning.Instances, dateTime);
      expect(result[0].action.action).to.equal(scheduling.actions.skip);
    });

    let asgModelWithInstancesTransitioning = {
      Instances: [{
        InstanceId: 'instanceId',
        Tags: [scheduleTag],
        State: { Name: 'not-running-or-stopped' }
      }],
      Tags: [environmentTag]
    };

    it('should skip if any asg instance is "transitioning"', () => {
      let result = scheduling.actionsForAutoScalingGroup(asgModelWithInstancesTransitioning, asgModelWithInstancesTransitioning.Instances, dateTime);
      expect(result[0].action.action).to.equal(scheduling.actions.skip);
    });
  });

  describe('scaling up with InService and Standby/Stopped', () => {
    let dateTime = '2016-10-21T17:57:00Z';
    let schedule = { Key: 'Schedule', Value: '2: 27 17 21 10 * 2016 | Europe/London' };

    let inServiceAndStandbyStopped = [{
      InstanceId: 'instanceA',
      State: { Name: 'running' },
      LifecycleState: 'InService'
    }, {
      InstanceId: 'instanceB',
      State: { Name: 'stopped' },
      LifecycleState: 'Standby'
    }];

    let asg = {
      Instances: inServiceAndStandbyStopped,
      Tags: [environmentTag, schedule]
    };

    asg.Instances.forEach(function (i) { i.AutoScalingGroup = asg; });

    it('should switch on "instanceB"', () => {
      let result = scheduling.actionsForAutoScalingGroup(asg, asg.Instances, dateTime);
      expect(result[0].action.action).to.equal(scheduling.actions.switchOn);
      expect(result[0].instance.id).to.equal('instanceB');
    });
  });

  describe('scaling up with InService and Standby/Running', () => {
    let dateTime = '2016-10-21T17:57:00Z';
    let schedule = { Key: 'Schedule', Value: '2: 27 17 21 10 * 2016 | Europe/London' };

    let inServiceAndStandbyRunning = [{
      InstanceId: 'instanceA',
      State: { Name: 'running' },
      LifecycleState: 'InService'
    }, {
      InstanceId: 'instanceB',
      State: { Name: 'running' },
      LifecycleState: 'Standby'
    }];

    let asg = {
      Instances: inServiceAndStandbyRunning,
      Tags: [environmentTag, schedule]
    };

    asg.Instances.forEach(function (i) { i.AutoScalingGroup = asg; });

    it('should put "instanceB" to InService', () => {
      let result = scheduling.actionsForAutoScalingGroup(asg, asg.Instances, dateTime);
      expect(result[0].action.action).to.equal(scheduling.actions.putInService);
      expect(result[0].instance.id).to.equal('instanceB');
    });
  });

  describe('scaling down with InService and InService', () => {
    let dateTime = '2016-10-21T17:57:00Z';
    let schedule = { Key: 'Schedule', Value: '1: 27 17 21 10 * 2016 | Europe/London' };

    let inServiceAndStandbyStopped = [{
      InstanceId: 'instanceA',
      State: { Name: 'running' },
      LifecycleState: 'InService'
    }, {
      InstanceId: 'instanceB',
      State: { Name: 'running' },
      LifecycleState: 'InService'
    }];

    let asg = {
      Instances: inServiceAndStandbyStopped,
      Tags: [environmentTag, schedule]
    };

    asg.Instances.forEach(function (i) { i.AutoScalingGroup = asg; });

    it('should put "instanceB" out of service', () => {
      let result = scheduling.actionsForAutoScalingGroup(asg, asg.Instances, dateTime);
      expect(result[0].action.action).to.equal(scheduling.actions.putOutOfService);
      expect(result[0].instance.id).to.equal('instanceA');
    });
  });

  describe('scaling down with InService and Standby/Running', () => {
    let dateTime = '2016-10-21T17:57:00Z';
    let schedule = { Key: 'Schedule', Value: '2: 27 17 21 10 * 2016 | Europe/London' };

    let inServiceAndStandbyRunning = [{
      InstanceId: 'instanceA',
      State: { Name: 'running' },
      LifecycleState: 'InService'
    }, {
      InstanceId: 'instanceB',
      State: { Name: 'running' },
      LifecycleState: 'Standby'
    }];

    let asg = {
      Instances: inServiceAndStandbyRunning,
      Tags: [environmentTag, schedule]
    };

    asg.Instances.forEach(function (i) { i.AutoScalingGroup = asg; });

    it('should switch "instanceB" off', () => {
      let result = scheduling.actionsForAutoScalingGroup(asg, asg.Instances, dateTime);
      expect(result[0].action.action).to.equal(scheduling.actions.putInService);
      expect(result[0].instance.id).to.equal('instanceB');
    });
  });
});
