/* eslint-disable */

'use strict';

let assert = require('assert');
let later = require('later');
let rewire = require('rewire');
let sinon = require('sinon');

let getExpectedState = rewire('modules/scheduling/getExpectedState');

describe('Getting expected state from schedule(s)', () => {
  describe('from a single schedule', () => {
    let fromSingleEnvironmentSchedule;

    beforeEach(() => {
      fromSingleEnvironmentSchedule = getExpectedState.fromSingleEnvironmentSchedule;
    });

    describe('given incorrect arguments', () => {
      it('should return null if given no shedule', () => {
        let result = fromSingleEnvironmentSchedule();
        
        assert.strictEqual(result, null);
      });

      it('should return null if given invalid schedules', () => {
        let invalid = [false, '', true, 'mouse', {}, { withProp: 'prop' }];

        invalid.forEach((item) => {
          let result = fromSingleEnvironmentSchedule(item);
          
          assert.strictEqual(result, null);
        });
      });
    });

    describe('given a valid schedule', () => {
      describe('given a permanent schedule', () => {
        it('should return the permanent value', () => {
          let schedules = [{ permanent: 'goose' }, { permanent: 'rabbit' }];
          schedules.forEach((s) => {
            let result = fromSingleEnvironmentSchedule(s);
           
            assert.equal(result, s.permanent);
          });
        });
      });
    });
  });

  describe('from multiple schedules', () => {
    let fromMultipleEnvironmentSchedules;

    beforeEach(() => {
      fromMultipleEnvironmentSchedules = getExpectedState.fromMultipleEnvironmentSchedules;
    });

    describe('given the wrong arguments', () => {
      it('should return null if given no shedules', () => {
        let result = fromMultipleEnvironmentSchedules();
        
        assert.strictEqual(result, null);
      });

      it('should return null if given invalid schedules', () => {
        let invalid = [false, '', true, 'mouse', {}, { withProp: 'prop' }, []];

        invalid.forEach((item) => {
          let result = fromMultipleEnvironmentSchedules(item);
          
          assert.strictEqual(result, null);
        });
      });
    });

    describe('given a valid list of schedules', () => {
      let validScheduleList;

      beforeEach(() => {
        validScheduleList = [
          { recurrence: later.parse.text('every 5 mins'), state: 'some state' }
        ];
      });

      it('should return an expected state from a list of 1 schedule', () => {
        let result = fromMultipleEnvironmentSchedules(validScheduleList);
        
        assert.equal(result, 'some state');
      });

      it('should return the nearest past dateTime (to now) from the list of schedules', () => {
        let getLatest = sinon.stub().returns({});
        let getLatestSpy = sinon.spy(getLatest);
        getExpectedState.__set__({
          'getLatestSchedule': getLatestSpy
        });
        let date = new Date();

        let result = fromMultipleEnvironmentSchedules(validScheduleList, date);

        assert.ok(getLatestSpy.calledWith(validScheduleList, date));
      });
    });
  });
});

function produceSchedule(recurrence, state) {
  return { recurrence, state };
}
