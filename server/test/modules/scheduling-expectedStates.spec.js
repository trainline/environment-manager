/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const expect = require('chai').expect;
const _ = require('lodash');
const scheduling = require('modules/scheduling');

describe('scheduling (expected states)', () => {
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

    let fn = () => scheduling.expectedStateFromSchedule(schedule, dateTime);
    expect(fn).to.throw();
  });

  it('should throw an error if cron is invalid', () => {
    let schedule = 'blah: 0 0 1 1 * 2016';
    let dateTime = '2015-12-31T23:59:59';

    let fn = () => scheduling.expectedStateFromSchedule(schedule, dateTime);
    expect(fn).to.throw();
  });

  it('should signal no schedule if no previous action found', () => {
    let schedule = 'stop: 0 0 1 1 * 2016; start: 0 1 1 1 * 2016';
    let dateTime = '2015-12-31T23:59:59';

    let fn = () => scheduling.expectedStateFromSchedule(schedule, dateTime);
    expect(fn).to.throw('Could not find state from schedule');
  });

  it('should signal no schedule if explicit no schedule', () => {
    let schedule = 'noschedule';
    let dateTime = '2015-12-31T23:59:59';

    let fn = () => scheduling.expectedStateFromSchedule(schedule, dateTime);
    expect(fn).to.throw('Cannot get state with NOSCHEDULE');
  });
});
