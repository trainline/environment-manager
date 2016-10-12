'use strict'

const expect = require('chai').expect;
const _ = require('lodash');
const scheduling = require('./index')

describe('scheduling', () => {

  let instance, scheduleTag;

  beforeEach(() => {
    scheduleTag = { Key: 'Schedule', Value: '247' };
    instance = {
      Tags: [
        scheduleTag
      ],
      State: { Name: 'running' },
      Environment: {}
    };
  });

  it('should skip instances which are members of an auto-scaling group', function() {
    instance.Tags.push(tag('aws:autoscaling:groupName', ''));

    let action = scheduling.actionForInstance(instance);

    expect(action.action).to.equal(scheduling.actions.skip);
    expect(action.reason).to.equal(scheduling.skipReasons.memberOfAsg);
  });

  it('should skip instances which are transitioning between states', function() {
    instance.State.Name = 'stopping';

    let action = scheduling.actionForInstance(instance);

    expect(action.action).to.equal(scheduling.actions.skip);
    expect(action.reason).to.equal(scheduling.skipReasons.transitioning);
  });

  it('should skip instances which have no schedule tag', function() {
    _.remove(instance.Tags, tag => tag.Key === 'Schedule');

    let action = scheduling.actionForInstance(instance);

    expect(action.action).to.equal(scheduling.actions.skip);
    expect(action.reason).to.equal(scheduling.skipReasons.noScheduleTag);
  });

  it('should skip instances which have whitespace schedule tags and no environment', function() {
    scheduleTag.Value = ''
    delete instance.Environment

    let action = scheduling.actionForInstance(instance);

    expect(action.action).to.equal(scheduling.actions.skip);
    expect(action.reason).to.equal(scheduling.skipReasons.noScheduleOrEnvironmentTag);
  });

  it('should skip instances whose schedule is set to NOSCHEDULE', function() {
    scheduleTag.Value = 'NOSCHEDULE'

    let action = scheduling.actionForInstance(instance);

    expect(action.action).to.equal(scheduling.actions.skip);
    expect(action.reason).to.equal(scheduling.skipReasons.explicitNoSchedule);
  });

  let invalidCrons = ['rubbish', 'rubbish:* * * * *', ':', 'start:;', 'start:*;gah:']

  invalidCrons.forEach(cron => {
    it(`should skip instances which have invalid schedule tags - ${cron}`, function() {
      scheduleTag.Value = cron

      let action = scheduling.actionForInstance(instance);

      expect(action.action).to.equal(scheduling.actions.skip);
      expect(action.reason).to.contain(scheduling.skipReasons.invalidSchedule);
      expect(action.reason).to.contain(scheduleTag.Value);
    });
  });

  describe('instances with a schedule tag', () => {

    describe('which are stopped', () => {

      beforeEach(() => {
        instance.State.Name = 'stopped';
      });

      it('should be switched on when instance schedule tag is "247"', function() {
        scheduleTag.Value = '247'

        let action = scheduling.actionForInstance(instance);

        expect(action.action).to.equal(scheduling.actions.switchOn);
        expect(action.source).to.equal(scheduling.sources.instance);
      });

      let switchOnTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T06:30:00Z' },
        { schedule: 'stop: 0 23 * * * *; start: 0 0 * * * *', dateTime: '2016-01-01T00:00:00Z' },
        { schedule: 'on', dateTime: '2016-01-01T06:30:00Z' },
        { schedule: 'on', dateTime: '2016-01-01T17:30:00Z' },
      ];

      switchOnTestCases.forEach(testCase => {
        it(`should be switched on when instance schedule tag is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function() {
          scheduleTag.Value = testCase.schedule

          let action = scheduling.actionForInstance(instance, testCase.dateTime);

          expect(action.action).to.equal(scheduling.actions.switchOn);
          expect(action.source).to.equal(scheduling.sources.instance);
        });
      });

      it('should be skipped when instance schedule tag is "off"', function() {
        scheduleTag.Value = 'off'

        let action = scheduling.actionForInstance(instance);

        expect(action.action).to.equal(scheduling.actions.skip);
        expect(action.source).to.equal(scheduling.sources.instance);
        expect(action.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
      });

      let skipTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T07:30:00Z' },
        { schedule: 'stop: 0 23 * * * *; start: 0 0 * * * *', dateTime: '2016-01-01T23:59:59Z' },
        { schedule: 'on', dateTime: '2016-01-01T05:30:00Z' },
        { schedule: 'on', dateTime: '2016-01-01T19:30:00Z' },
      ];

      skipTestCases.forEach(testCase => {
        it(`should be skipped when instance schedule tag is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function() {
          scheduleTag.Value = testCase.schedule

          let action = scheduling.actionForInstance(instance, testCase.dateTime);

          expect(action.action).to.equal(scheduling.actions.skip);
          expect(action.source).to.equal(scheduling.sources.instance);
          expect(action.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
        });
      });

    });

    describe('which are running', () => {

      beforeEach(() => {
        instance.State.Name = 'running';
      });

      it('should be switched off when instance schedule tag is "off"', function() {
        scheduleTag.Value = 'off'

        let action = scheduling.actionForInstance(instance);

        expect(action.action).to.equal(scheduling.actions.switchOff);
        expect(action.source).to.equal(scheduling.sources.instance);
      });

      let switchOffTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T05:30:00Z' },
        { schedule: 'stop: 0 23 * * * *; start: 0 0 * * * *', dateTime: '2016-01-01T23:59:59Z' },
        { schedule: 'off', dateTime: '2016-01-01T05:30:00Z' },
        { schedule: 'off', dateTime: '2016-01-01T19:30:00Z' },
      ];

      switchOffTestCases.forEach(testCase => {
        it(`should be switched off when instance schedule tag is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function() {
          scheduleTag.Value = testCase.schedule

          let action = scheduling.actionForInstance(instance, testCase.dateTime);

          expect(action.action).to.equal(scheduling.actions.switchOff);
          expect(action.source).to.equal(scheduling.sources.instance);
        });
      });

      it('should be skipped when instance schedule tag is "247"', function() {
        scheduleTag.Value = '247'

        let action = scheduling.actionForInstance(instance);

        expect(action.action).to.equal(scheduling.actions.skip);
        expect(action.source).to.equal(scheduling.sources.instance);
        expect(action.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
      });

      let skipTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T06:30:00Z' },
        { schedule: 'stop: 0 23 * * * *; start: 0 0 * * * *', dateTime: '2016-01-01T00:00:00Z' },
        { schedule: 'on', dateTime: '2016-01-01T06:30:00Z' },
        { schedule: 'on', dateTime: '2016-01-01T17:30:00Z' },
      ];

      skipTestCases.forEach(testCase => {
        it(`should be skipped when instance schedule tag is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function() {
          scheduleTag.Value = testCase.schedule

          let action = scheduling.actionForInstance(instance, testCase.dateTime);

          expect(action.action).to.equal(scheduling.actions.skip);
          expect(action.source).to.equal(scheduling.sources.instance);
          expect(action.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
        });
      });

    });

  });

  describe('instances which fall back to environment schedule', () => {

    beforeEach(() => {
      scheduleTag.Value = '';
    });

    describe('which are stopped', () => {

      beforeEach(() => {
        instance.State.Name = 'stopped';
      });

      it('should be switched on when environment schedule is "on"', function() {
        instance.Environment.ManualScheduleUp = true;

        let action = scheduling.actionForInstance(instance);

        expect(action.action).to.equal(scheduling.actions.switchOn);
        expect(action.source).to.equal(scheduling.sources.environment);
      });

      it('should be skipped when environment schedule is "off"', function() {
        instance.Environment.ManualScheduleUp = false;
        instance.Environment.ScheduleAutomatically = false;

        let action = scheduling.actionForInstance(instance);

        expect(action.action).to.equal(scheduling.actions.skip);
        expect(action.source).to.equal(scheduling.sources.environment);
        expect(action.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
      });

      let switchOnTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T06:30:00Z' },
      ];

      switchOnTestCases.forEach(testCase => {
        it(`should be switched on when environment schedule is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function() {
          instance.Environment.ScheduleAutomatically = true;
          instance.Environment.DefaultSchedule = testCase.schedule;

          let action = scheduling.actionForInstance(instance, testCase.dateTime);

          expect(action.action).to.equal(scheduling.actions.switchOn);
          expect(action.source).to.equal(scheduling.sources.environment);
        });
      });

      let skipTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T07:30:00Z' },
      ];

      skipTestCases.forEach(testCase => {
        it(`should be skipped when environment schedule is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function() {
          instance.Environment.ScheduleAutomatically = true;
          instance.Environment.DefaultSchedule = testCase.schedule;

          let action = scheduling.actionForInstance(instance, testCase.dateTime);

          expect(action.action).to.equal(scheduling.actions.skip);
          expect(action.source).to.equal(scheduling.sources.environment);
          expect(action.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
        });
      });

    });

    describe('which are running', () => {

      beforeEach(() => {
        instance.State.Name = 'running';
      });

      it('should be switched off when environment schedule is "off"', function() {
        instance.Environment.ManualScheduleUp = false;
        instance.Environment.ScheduleAutomatically = false;

        let action = scheduling.actionForInstance(instance);

        expect(action.action).to.equal(scheduling.actions.switchOff);
        expect(action.source).to.equal(scheduling.sources.environment);
      });

      it('should be skipped when environment schedule is "on"', function() {
        instance.Environment.ManualScheduleUp = true;

        let action = scheduling.actionForInstance(instance);

        expect(action.action).to.equal(scheduling.actions.skip);
        expect(action.source).to.equal(scheduling.sources.environment);
        expect(action.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
      });

      let switchOffTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T05:30:00Z' },
      ];

      switchOffTestCases.forEach(testCase => {
        it(`should be switched off when environment schedule is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function() {
          instance.Environment.ScheduleAutomatically = true;
          instance.Environment.DefaultSchedule = testCase.schedule

          let action = scheduling.actionForInstance(instance, testCase.dateTime);

          expect(action.action).to.equal(scheduling.actions.switchOff);
          expect(action.source).to.equal(scheduling.sources.environment);
        });
      });

      let skipTestCases = [
        { schedule: 'start: 0 6 * * * *; stop: 0 7 * * * *', dateTime: '2016-01-01T06:30:00Z' },
      ];

      skipTestCases.forEach(testCase => {
        it(`should be skipped when environment schedule is "${testCase.schedule}" and the datetime is ${testCase.dateTime}`, function() {
          instance.Environment.ScheduleAutomatically = true;
          instance.Environment.DefaultSchedule = testCase.schedule

          let action = scheduling.actionForInstance(instance, testCase.dateTime);

          expect(action.action).to.equal(scheduling.actions.skip);
          expect(action.source).to.equal(scheduling.sources.environment);
          expect(action.reason).to.equal(scheduling.skipReasons.stateIsCorrect);
        });
      });

    });

  });

});

function tag(key, value) {
  return { Key: key, Value: value };
}