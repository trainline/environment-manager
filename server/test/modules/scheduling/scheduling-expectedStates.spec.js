/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const expect = require('chai').expect;
const scheduling = require('../../../modules/scheduling');

describe('scheduling (expected states)', () => {
  describe('tag schedules', () => {
    it('should be in the "on" state after start and before stop', () => {
      let schedule = 'start: 0 0 1 1 * 2016; stop: 0 1 1 1 * 2016';
      let dateTime = '2016-01-01T00:15:00';

      let determinedState = scheduling.expectedStateFromSchedule(schedule, dateTime);
      expect(determinedState).to.equal(scheduling.states.on);
    });

    it('should be in the "off" state after stop and before start', () => {
      let schedule = 'stop: 0 0 1 1 * 2016; start: 0 1 1 1 * 2016';
      let dateTime = '2016-01-01T00:15:00';

      let determinedState = scheduling.expectedStateFromSchedule(schedule, dateTime);
      expect(determinedState).to.equal(scheduling.states.off);
    });

    it('should throw an error if schedule is invalid', () => {
      let schedule = 'blah blah';
      let dateTime = '2015-12-31T23:59:59';

      let determinedState = scheduling.expectedStateFromSchedule(schedule, dateTime);
      expect(determinedState).to.equal('INVALID SCHEDULE');
    });

    it('should signal no schedule if no previous action found', () => {
      let schedule = 'stop: 0 0 1 1 * 2016; start: 0 1 1 1 * 2016';
      let dateTime = '2015-12-31T23:59:59';

      let determinedState = scheduling.expectedStateFromSchedule(schedule, dateTime);
      expect(determinedState).to.equal('NOT FOUND');
    });

    it('should signal no schedule if explicit no schedule', () => {
      let schedule = 'noschedule';
      let dateTime = '2015-12-31T23:59:59';

      let determinedState = scheduling.expectedStateFromSchedule(schedule, dateTime);
      expect(determinedState).to.equal('NO SCHEDULE');
    });
  });

  describe('environment schedules', () => {
    it('should be in the "on" state after start and before stop', () => {
      let schedule = { ScheduleAutomatically: true, DefaultSchedule: 'start: 0 0 1 1 * 2016; stop: 0 1 1 1 * 2016' };
      let dateTime = '2016-01-01T00:15:00';

      let determinedState = scheduling.expectedStateFromSchedule(schedule, dateTime);
      expect(determinedState).to.equal(scheduling.states.on);
    });

    it('should be in the "off" state after stop and before start', () => {
      let schedule = { ScheduleAutomatically: true, DefaultSchedule: 'stop: 0 0 1 1 * 2016; start: 0 1 1 1 * 2016' };
      let dateTime = '2016-01-01T00:15:00';

      let determinedState = scheduling.expectedStateFromSchedule(schedule, dateTime);
      expect(determinedState).to.equal(scheduling.states.off);
    });

    it('should be in the "on" state if environment is permanently on', () => {
      let schedule = { ManualScheduleUp: true };

      let determinedState = scheduling.expectedStateFromSchedule(schedule);
      expect(determinedState).to.equal(scheduling.states.on);
    });

    it('should be in the "off" state if environment is permanently off', () => {
      let schedule = { ScheduleAutomatically: false, ManualScheduleUp: false };

      let determinedState = scheduling.expectedStateFromSchedule(schedule);
      expect(determinedState).to.equal(scheduling.states.off);
    });
  });

  describe('schedules with timezones', () => {
    it('should support timezone identifiers', () => {
      let schedule = 'start: 0 0 1 1 * 2016; stop: 0 1 1 1 * 2016 | Europe/London';
      let dateTime = '2016-01-01T00:15:00';

      let determinedState = scheduling.expectedStateFromSchedule(schedule, dateTime);
      expect(determinedState).to.equal(scheduling.states.on);
    });

    it('should switch off at 17:00:00 UTC when scheduled off at 17:00:00 London time in January', () => {
      let schedule = 'stop: 0 17 1 1 * 2017 | Europe/London';
      let dateTime = '2017-01-01T17:00:00';

      let determinedState = scheduling.expectedStateFromSchedule(schedule, dateTime);
      expect(determinedState).to.equal(scheduling.states.off);
    });

    it('should switch off at 17:00:00 UTC when scheduled off at 18:00:00 London time in June', () => {
      let schedule = 'stop: 0 18 1 6 * 2017 | Europe/London';
      let dateTime = '2017-06-01T17:00:00';

      let determinedState = scheduling.expectedStateFromSchedule(schedule, dateTime);
      expect(determinedState).to.equal(scheduling.states.off);
    });

    it('should switch off at 18:00:00+0100 when scheduled off at 18:00:00 London time in June', () => {
      let schedule = 'stop: 0 18 1 6 * 2017 | Europe/London';
      let dateTime = '2017-06-01T18:00:00+0100';

      let determinedState = scheduling.expectedStateFromSchedule(schedule, dateTime);
      expect(determinedState).to.equal(scheduling.states.off);
    });
  });
});
