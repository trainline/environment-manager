'use strict';

/* eslint-disable */

let assert = require('assert');
let rewire = require('rewire');
let sinon = require('sinon');

let getScheduleByEnvironment = rewire('modules/scheduling/getScheduleByEnvironment');

describe('Getting schedule for an environment', () => {
  let blankEnvironment;

  beforeEach(() => {
    blankEnvironment = createEnvironment();
  });

  it('should exist', () => {
    assert.ok(getScheduleByEnvironment);
  });

  describe('permanent off', () => {
    it('should be off with a false Manual Schedule Up and false ScheduleAutomatcally', () => {
      blankEnvironment.ManualScheduleUp = false;
      blankEnvironment.ScheduleAutomatically = false;
      let result = getScheduleByEnvironment(blankEnvironment);
      assert.equal(result.parseResult.schedule.permanent, 'off');
    });
  }); 

  describe('permanent on', () => {
    it('should be on with true Manual Schedule Up and true ScheduleAutomatcally', () => {
      blankEnvironment.ManualScheduleUp = true;
      blankEnvironment.ScheduleAutomatically = true;
      let result = getScheduleByEnvironment(blankEnvironment);
      assert.equal(result.parseResult.schedule.permanent, 'on');
    });
  });

  describe('Default Schedule', () => {
    let parseScheduleSpy; 

    beforeEach(() => {
      parseScheduleSpy = sinon.spy(sinon.stub().returns({}));
      getScheduleByEnvironment.__set__({
        'parseSchedule': parseScheduleSpy
      });
    });

    it('will be parsed if it cannot determine a permanent value based on Manual Schedule Up and Schedule Automatically', () => {
      let schedule = createEnvironment();
      schedule.ManualScheduleUp = false;
      schedule.ScheduleAutomatically = true;
      schedule.DefaultSchedule = {};
      let result = getScheduleByEnvironment(schedule);
      assert.ok(parseScheduleSpy.calledWith(schedule.DefaultSchedule));
    });
  });
}); 

function createEnvironment() {
  return {
    ManualScheduleUp: null,
    ScheduleAutomatically: null,
    DefaultSchedule: null
  };
}
