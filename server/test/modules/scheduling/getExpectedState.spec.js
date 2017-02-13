/* eslint-disable */

'use strict';

let assert = require('assert');
let later = require('later');
let rewire = require('rewire');

let getExpectedState = rewire('modules/scheduling/getExpectedState');

describe('Getting expected state from schedule(s)', () => {
  it('should exist', () => {
    assert.ok(getExpectedState);
    assert.ok(getExpectedState.fromSingleSchedule);
    assert.ok(getExpectedState.fromMultipleSchedules);
  });

  describe('from a single schedule', () => {
    let fromSingleSchedule;

    beforeEach(() => {
      fromSingleSchedule = getExpectedState.fromSingleSchedule;
    });

    describe('given incorrect arguments', () => {
      it('should return null if given no shedule', () => {
        let result = fromSingleSchedule();
        assert.strictEqual(result, null);
      });

      it('should return null if given invalid schedules', () => {
        let invalid = [false, '', true, 'mouse', {}, { withProp: 'prop' }];

        invalid.forEach((item) => {
          let result = fromSingleSchedule(item);
          assert.strictEqual(result, null);
        });
      });
    });

    describe('given a valid schedule', () => {
      describe('given a permanent schedule', () => {
        it('should return the permanent value', () => {
          let schedules = [{ permanent: 'goose' }, { permanent: 'rabbit' }];
          schedules.forEach((s) => {
            let result = fromSingleSchedule(s);
            assert.equal(result, s.permanent);
          });
        });
      });
    });
  });

  describe('from multiple schedules', () => {
    let fromMultipleSchedules;

    beforeEach(() => {
      fromMultipleSchedules = getExpectedState.fromMultipleSchedules;
    });

    describe('given the wrong arguments', () => {
      it('should return null if given no shedules', () => {
        let result = fromMultipleSchedules();
        assert.strictEqual(result, null);
      });

      it('should return null if given invalid schedules', () => {
        let invalid = [false, '', true, 'mouse', {}, { withProp: 'prop' }, []];

        invalid.forEach((item) => {
          let result = fromMultipleSchedules(item);
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
        let result = fromMultipleSchedules(validScheduleList);
        assert.equal(result, 'some state');
      });

      // TODO: learn the ins and outs of later and creating schedules. 
      //       Currently this functionality is tested indirectly through other modules. 
      //       This still needs to be tested now it's being exposed to the outside world!
      it('should return the nearest past dateTime (to now) from the list of schedules', () => {
        
      });
    });
  });
});

function produceSchedule(recurrence, state) {
  return { recurrence, state };
}
