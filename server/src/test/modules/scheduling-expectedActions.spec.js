/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const expect = require('chai').expect;
const scheduling = require('../../modules/scheduling');

describe('scheduling (expected actions)', () => {
  let instance;
  let scheduleTag;

  beforeEach(() => {
    scheduleTag = { Key: 'Schedule', Value: '247' };
    instance = {
      InstanceId: 'instanceId',
      Tags: [
        scheduleTag
      ],
      State: { Name: 'running' },
      Environment: {}
    };
  });

  it('should skip instances which are transitioning between states', function () {
    instance.State.Name = 'stopping';

    let result = scheduling.actionForInstance(instance).action;

    expect(result.action).to.equal(scheduling.actions.skip);
    expect(result.reason).to.equal(scheduling.skipReasons.transitioning);
  });

  it('should skip instances which have no environment', function () {
    delete instance.Environment;

    let result = scheduling.actionForInstance(instance).action;

    expect(result.action).to.equal(scheduling.actions.skip);
    expect(result.reason).to.equal(scheduling.skipReasons.noEnvironment);
  });

  it('should skip instances whose schedule is set to NOSCHEDULE', function () {
    scheduleTag.Value = 'NOSCHEDULE';

    let result = scheduling.actionForInstance(instance).action;

    expect(result.action).to.equal(scheduling.actions.skip);
    expect(result.reason).to.equal(scheduling.skipReasons.explicitNoSchedule);
  });

  it('should skip instances in maintenance mode', function () {
    instance.Tags.push({ Key: 'MAINTENANCE', Value: 'TRUE' });

    let result = scheduling.actionForInstance(instance).action;

    expect(result.action).to.equal(scheduling.actions.skip);
    expect(result.reason).to.equal(scheduling.skipReasons.maintenanceMode);
  });

  let invalidCrons = ['rubbish', ':', 'start:;', 'start:*;gah:'];

  invalidCrons.forEach((cron) => {
    it(`should skip instances which have invalid schedule tags - ${cron}`, function () {
      scheduleTag.Value = cron;

      let result = scheduling.actionForInstance(instance).action;

      expect(result.action).to.equal(scheduling.actions.skip);
      expect(result.reason).to.contain(scheduling.skipReasons.invalidSchedule);
    });
  });

  it('should be skipped when the instance has only schedules in the future', function () {
    let dateTime = '2016-10-21T15:57:00Z';
    scheduleTag.Value = 'stop: 27 16 21 10 * 2016';

    let result = scheduling.actionForInstance(instance, dateTime).action;

    expect(result.action).to.equal(scheduling.actions.skip);
    expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
  });

  it('should be stopped when a future stop schedule arrives', function () {
    let dateTime = '2016-10-21T16:57:00Z';
    scheduleTag.Value = 'stop: 27 16 21 10 * 2016';

    let result = scheduling.actionForInstance(instance, dateTime).action;

    expect(result.action).to.equal(scheduling.actions.switchOff);
  });

  it('should be stopped when a future stop schedule arrives in another timezone', function () {
    let dateTime = '2016-10-21T16:57:00Z';
    scheduleTag.Value = 'stop: 27 17 21 10 * 2016 | Europe/London';

    let result = scheduling.actionForInstance(instance, dateTime).action;

    expect(result.action).to.equal(scheduling.actions.switchOff);
  });

  describe('instances in an ASG', () => {
    let asgInstance = { InstanceId: 'instanceId' };

    beforeEach(() => {
      instance.AutoScalingGroup = {
        AutoScalingGroupName: 'x',
        Instances: [asgInstance]
      };
    });

    it('should be skipped when transitioning between lifecycle states', function () {
      asgInstance.LifecycleState = 'some-weird-state';

      let result = scheduling.actionForInstance(instance).action;

      expect(result.action).to.equal(scheduling.actions.skip);
      expect(result.reason).to.equal(scheduling.skipReasons.asgTransitioning);
    });

    it('should be put in to standby before being switched off if they\'re in service', function () {
      instance.State.Name = 'running';
      scheduleTag.Value = 'off';
      asgInstance.LifecycleState = 'InService';

      let result = scheduling.actionForInstance(instance).action;

      expect(result.action).to.equal(scheduling.actions.putOutOfService);
    });

    it('should be switched off if they\'re if they\'re already in standby and scheduled off', function () {
      instance.State.Name = 'running';
      scheduleTag.Value = 'off';
      asgInstance.LifecycleState = 'Standby';

      let result = scheduling.actionForInstance(instance).action;

      expect(result.action).to.equal(scheduling.actions.switchOff);
    });

    it('should be switched on before being put in service if they\'re switched off', function () {
      instance.State.Name = 'stopped';
      scheduleTag.Value = '247';
      asgInstance.LifecycleState = 'Standby';

      let result = scheduling.actionForInstance(instance).action;

      expect(result.action).to.equal(scheduling.actions.switchOn);
    });

    it('should be put in service if they\'re already switched on and scheduled on', function () {
      instance.State.Name = 'running';
      scheduleTag.Value = '247';
      asgInstance.LifecycleState = 'Standby';

      let result = scheduling.actionForInstance(instance).action;

      expect(result.action).to.equal(scheduling.actions.putInService);
    });
  });

  describe('instances with a schedule tag', () => {
    describe('which are stopped', () => {
      beforeEach(() => {
        instance.State.Name = 'stopped';
      });

      it('should be switched on when instance schedule tag is "247"', function () {
        scheduleTag.Value = '247';

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.switchOn);
        expect(result.source).to.equal(scheduling.sources.instance);
      });

      it('should be switched on when instance schedule tag is "on"', function () {
        scheduleTag.Value = 'ON';

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.switchOn);
        expect(result.source).to.equal(scheduling.sources.instance);
      });

      let switchOnTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T06:30:00Z' },
        { schedule: 'stop: 0 23 * * * *; start: 0 0 * * * *', dateTime: '2016-01-01T00:00:00Z' },
        { schedule: 'on', dateTime: '2016-01-01T06:30:00Z' },
        { schedule: 'on', dateTime: '2016-01-01T17:30:00Z' }
      ];

      switchOnTestCases.forEach((testCase) => {
        it(`should be switched on when instance schedule tag is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          scheduleTag.Value = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.switchOn);
          expect(result.source).to.equal(scheduling.sources.instance);
        });
      });

      it('should be skipped when instance schedule tag is "off"', function () {
        scheduleTag.Value = 'off';

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.skip);
        expect(result.source).to.equal(scheduling.sources.instance);
        expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
      });

      let skipTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T07:30:00Z' },
        { schedule: 'stop: 0 23 * * * *; start: 0 0 * * * *', dateTime: '2016-01-01T23:59:59Z' }
      ];

      skipTestCases.forEach((testCase) => {
        it(`should be skipped when instance schedule tag is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          scheduleTag.Value = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.skip);
          expect(result.source).to.equal(scheduling.sources.instance);
          expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
        });
      });
    });

    describe('which are running', () => {
      beforeEach(() => {
        instance.State.Name = 'running';
      });

      it('should be switched off when instance schedule tag is "off"', function () {
        scheduleTag.Value = 'off';

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.switchOff);
        expect(result.source).to.equal(scheduling.sources.instance);
      });

      let switchOffTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T05:30:00Z' },
        { schedule: 'stop: 0 23 * * * *; start: 0 0 * * * *', dateTime: '2016-01-01T23:59:59Z' },
        { schedule: 'off', dateTime: '2016-01-01T05:30:00Z' },
        { schedule: 'off', dateTime: '2016-01-01T19:30:00Z' }
      ];

      switchOffTestCases.forEach((testCase) => {
        it(`should be switched off when instance schedule tag is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          scheduleTag.Value = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.switchOff);
          expect(result.source).to.equal(scheduling.sources.instance);
        });
      });

      it('should be skipped when instance schedule tag is "247"', function () {
        scheduleTag.Value = '247';

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.skip);
        expect(result.source).to.equal(scheduling.sources.instance);
        expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
      });

      it('should be skipped when instance schedule tag is "ON"', function () {
        scheduleTag.Value = 'ON';

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.skip);
        expect(result.source).to.equal(scheduling.sources.instance);
        expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
      });

      let skipTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T06:30:00Z' },
        { schedule: 'stop: 0 23 * * * *; start: 0 0 * * * *', dateTime: '2016-01-01T00:00:00Z' },
        { schedule: 'on', dateTime: '2016-01-01T06:30:00Z' },
        { schedule: 'on', dateTime: '2016-01-01T17:30:00Z' }
      ];

      skipTestCases.forEach((testCase) => {
        it(`should be skipped when instance schedule tag is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          scheduleTag.Value = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.skip);
          expect(result.source).to.equal(scheduling.sources.instance);
          expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
        });
      });
    });
  });

  describe('instances with no schedule tag and no ASG', () => {
    beforeEach(() => {
      scheduleTag.Value = '';
    });

    describe('which are stopped', () => {
      beforeEach(() => {
        instance.State.Name = 'stopped';
      });

      it('should be switched on when environment schedule is "on"', function () {
        instance.Environment.ManualScheduleUp = true;

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.switchOn);
        expect(result.source).to.equal(scheduling.sources.environment);
      });

      it('should be skipped when environment schedule is "off"', function () {
        instance.Environment.ManualScheduleUp = false;
        instance.Environment.ScheduleAutomatically = false;

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.skip);
        expect(result.source).to.equal(scheduling.sources.environment);
        expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
      });

      let switchOnTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T06:30:00Z' }
      ];

      switchOnTestCases.forEach((testCase) => {
        it(`should be switched on when environment schedule is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          instance.Environment.ScheduleAutomatically = true;
          instance.Environment.DefaultSchedule = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.switchOn);
          expect(result.source).to.equal(scheduling.sources.environment);
        });
      });

      let skipTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T07:30:00Z' }
      ];

      skipTestCases.forEach((testCase) => {
        it(`should be skipped when environment schedule is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          instance.Environment.ScheduleAutomatically = true;
          instance.Environment.DefaultSchedule = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.skip);
          expect(result.source).to.equal(scheduling.sources.environment);
          expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
        });
      });
    });

    describe('which are running', () => {
      beforeEach(() => {
        instance.State.Name = 'running';
      });

      it('should be switched off when environment schedule is "off"', function () {
        instance.Environment.ManualScheduleUp = false;
        instance.Environment.ScheduleAutomatically = false;

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.switchOff);
        expect(result.source).to.equal(scheduling.sources.environment);
      });

      it('should be skipped when environment schedule is "on"', function () {
        instance.Environment.ManualScheduleUp = true;

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.skip);
        expect(result.source).to.equal(scheduling.sources.environment);
        expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
      });

      let switchOffTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T05:30:00Z' }
      ];

      switchOffTestCases.forEach((testCase) => {
        it(`should be switched off when environment schedule is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          instance.Environment.ScheduleAutomatically = true;
          instance.Environment.DefaultSchedule = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.switchOff);
          expect(result.source).to.equal(scheduling.sources.environment);
        });
      });

      let skipTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T06:30:00Z' }
      ];

      skipTestCases.forEach((testCase) => {
        it(`should be skipped when environment schedule is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          instance.Environment.ScheduleAutomatically = true;
          instance.Environment.DefaultSchedule = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.skip);
          expect(result.source).to.equal(scheduling.sources.environment);
          expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
        });
      });
    });
  });

  describe('instances with no schedule tag but in an ASG with a schedule tag', () => {
    let asgScheduleTag = { Key: 'Schedule', Value: '' };

    beforeEach(() => {
      scheduleTag.Value = '';
      instance.AutoScalingGroup = {
        AutoScalingGroupName: 'x',
        Tags: [asgScheduleTag]
      };
    });

    describe('which are stopped', () => {
      beforeEach(() => {
        instance.State.Name = 'stopped';
        instance.AutoScalingGroup.Instances = [{ InstanceId: 'instanceId', LifecycleState: 'Standby' }];
      });

      it('should be put in service when instance schedule tag is "247"', function () {
        asgScheduleTag.Value = '247';

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.switchOn);
        expect(result.source).to.equal(scheduling.sources.asg);
      });

      it('should be put in service when instance schedule tag is "ON"', function () {
        asgScheduleTag.Value = 'ON';

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.switchOn);
        expect(result.source).to.equal(scheduling.sources.asg);
      });

      let switchOnTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T06:30:00Z' },
        { schedule: 'stop: 0 23 * * * *; start: 0 0 * * * *', dateTime: '2016-01-01T00:00:00Z' },
        { schedule: 'on', dateTime: '2016-01-01T06:30:00Z' },
        { schedule: 'on', dateTime: '2016-01-01T17:30:00Z' }
      ];

      switchOnTestCases.forEach((testCase) => {
        it(`should be put in service when instance schedule tag is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          asgScheduleTag.Value = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.switchOn);
          expect(result.source).to.equal(scheduling.sources.asg);
        });
      });

      it('should be skipped when instance schedule tag is "off"', function () {
        asgScheduleTag.Value = 'off';

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.skip);
        expect(result.source).to.equal(scheduling.sources.asg);
        expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
      });

      let skipTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T07:30:00Z' },
        { schedule: 'stop: 0 23 * * * *; start: 0 0 * * * *', dateTime: '2016-01-01T23:59:59Z' }
      ];

      skipTestCases.forEach((testCase) => {
        it(`should be skipped when instance schedule tag is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          asgScheduleTag.Value = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.skip);
          expect(result.source).to.equal(scheduling.sources.asg);
          expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
        });
      });
    });

    describe('which are running', () => {
      beforeEach(() => {
        instance.State.Name = 'running';
        instance.AutoScalingGroup.Instances = [{ InstanceId: 'instanceId', LifecycleState: 'Standby' }];
      });

      it('should be switched off when instance schedule tag is "off"', function () {
        asgScheduleTag.Value = 'off';

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.switchOff);
        expect(result.source).to.equal(scheduling.sources.asg);
      });

      let switchOffTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T05:30:00Z' },
        { schedule: 'stop: 0 23 * * * *; start: 0 0 * * * *', dateTime: '2016-01-01T23:59:59Z' },
        { schedule: 'off', dateTime: '2016-01-01T05:30:00Z' },
        { schedule: 'off', dateTime: '2016-01-01T19:30:00Z' }
      ];

      switchOffTestCases.forEach((testCase) => {
        it(`should be switched off when instance schedule tag is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          asgScheduleTag.Value = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.switchOff);
          expect(result.source).to.equal(scheduling.sources.asg);
        });
      });

      it('should be put in service when instance schedule tag is "247"', function () {
        asgScheduleTag.Value = '247';

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.putInService);
        expect(result.source).to.equal(scheduling.sources.asg);
      });

      it('should be put in service when instance schedule tag is "ON"', function () {
        asgScheduleTag.Value = 'ON';

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.putInService);
        expect(result.source).to.equal(scheduling.sources.asg);
      });

      let skipTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T06:30:00Z' },
        { schedule: 'stop: 0 23 * * * *; start: 0 0 * * * *', dateTime: '2016-01-01T00:00:00Z' },
        { schedule: 'on', dateTime: '2016-01-01T06:30:00Z' },
        { schedule: 'on', dateTime: '2016-01-01T17:30:00Z' }
      ];

      skipTestCases.forEach((testCase) => {
        it(`should be put in service when instance schedule tag is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          asgScheduleTag.Value = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.putInService);
          expect(result.source).to.equal(scheduling.sources.asg);
        });
      });
    });
  });

  describe('instances with no schedule tag in an ASG with no schedule tag', () => {
    let asgScheduleTag = { Key: 'Schedule', Value: ' ' };

    beforeEach(() => {
      scheduleTag.Value = ' ';
      instance.AutoScalingGroup = {
        AutoScalingGroupName: 'x',
        Tags: [asgScheduleTag]
      };
    });

    describe('which are stopped', () => {
      beforeEach(() => {
        instance.State.Name = 'stopped';
        instance.AutoScalingGroup.Instances = [{ InstanceId: 'instanceId', LifecycleState: 'Standby' }];
      });

      it('should be switched on when environment schedule is "on"', function () {
        instance.Environment.ManualScheduleUp = true;

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.switchOn);
        expect(result.source).to.equal(scheduling.sources.environment);
      });

      let switchOnTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T06:30:00Z' }
      ];

      switchOnTestCases.forEach((testCase) => {
        it(`should be switched on when environment schedule is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          instance.Environment.ScheduleAutomatically = true;
          instance.Environment.DefaultSchedule = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.switchOn);
          expect(result.source).to.equal(scheduling.sources.environment);
        });
      });

      it('should be skipped when environment schedule is "off"', function () {
        instance.Environment.ManualScheduleUp = false;
        instance.Environment.ScheduleAutomatically = false;

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.skip);
        expect(result.source).to.equal(scheduling.sources.environment);
        expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
      });

      let skipTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T07:30:00Z' }
      ];

      skipTestCases.forEach((testCase) => {
        it(`should be skipped when environment schedule is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          instance.Environment.ScheduleAutomatically = true;
          instance.Environment.DefaultSchedule = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.skip);
          expect(result.source).to.equal(scheduling.sources.environment);
          expect(result.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
        });
      });
    });

    describe('which are running', () => {
      beforeEach(() => {
        instance.State.Name = 'running';
        instance.AutoScalingGroup.Instances = [{ InstanceId: 'instanceId', LifecycleState: 'Standby' }];
      });

      it('should be switched off when environment schedule is "off"', function () {
        instance.Environment.ManualScheduleUp = false;
        instance.Environment.ScheduleAutomatically = false;

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.switchOff);
        expect(result.source).to.equal(scheduling.sources.environment);
      });

      let switchOffTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T05:30:00Z' }
      ];

      switchOffTestCases.forEach((testCase) => {
        it(`should be switched off when environment schedule is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          instance.Environment.ScheduleAutomatically = true;
          instance.Environment.DefaultSchedule = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.switchOff);
          expect(result.source).to.equal(scheduling.sources.environment);
        });
      });

      it('should be put in service when environment schedule is "on"', function () {
        instance.Environment.ManualScheduleUp = true;

        let result = scheduling.actionForInstance(instance).action;

        expect(result.action).to.equal(scheduling.actions.putInService);
        expect(result.source).to.equal(scheduling.sources.environment);
      });

      let skipTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T06:30:00Z' }
      ];

      skipTestCases.forEach((testCase) => {
        it(`should be put in service when environment schedule is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function () {
          instance.Environment.ScheduleAutomatically = true;
          instance.Environment.DefaultSchedule = testCase.schedule;

          let result = scheduling.actionForInstance(instance, testCase.dateTime).action;

          expect(result.action).to.equal(scheduling.actions.putInService);
          expect(result.source).to.equal(scheduling.sources.environment);
        });
      });
    });
  });
});
