'use strict';

/* eslint-disable */

let assert = require('assert');
let rewire = require('rewire');
let sinon = require('sinon');

let getScheduleStateByAsg = rewire('modules/scheduling/getScheduleStateByAsg');

describe('getScheduleStateByAsg', () => {
  it('should return null when given invalid inputs', () => {
    let invalid = ['', 0, 'mouse', false, true, [], {}, { property: 'has something' }];

    invalid.forEach((x) => {
      assert.deepStrictEqual(getScheduleStateByAsg(x), null);
    });
  });

  it('should return an empty schedule when given an asg with no schedule', () => {
    let asg = createValidAsg();

    let result = getScheduleStateByAsg(asg);

    assert.deepStrictEqual(result, null);
  });

  it('should return the state of the schedule tag', () => {
    let asg = createValidAsg();
    asg.Tags = [
      { Key: 'nothing', Value: 'nonsense' },
      { Key: 'Schedule', Value: 'off' }
    ];

    let result = getScheduleStateByAsg(asg);

    assert.equal(result, 'off');
  });
});

function createValidAsg() {
  let asg = {
    Tags: [{ Key: '', Value: '' }]
  };
  return asg;
}
