'use strict';

let assert = require('assert');
let tagHelper = require('./helpers/tags');
let sinon = require('sinon');

let getScheduleByAsg = require('modules/scheduling/getScheduleByAsg');

describe('getScheduleByAsg', () => {
  it('should exist', () => {
    assert.ok(getScheduleByAsg);
  });

  it('should be function', () => {
    let type = typeof getScheduleByAsg;
    assert.equal(type, 'function');
  });

  it('should return an empty schedule when given invalid inputs', () => {
    let invalid = ['', 0, 'mouse', false, true, [], {}, { property: 'has something' }];

    invalid.forEach((x) => {
      assert.deepStrictEqual(getScheduleByAsg(x), { parseResult: null, source: null });
    });
  });

  it('should return an empty schedule when given an asg with no schedule', () => {
    let asg = createValidAsg();
    asg.Tags[1].Key = 'NOT Schedule';

    let result = getScheduleByAsg(asg);

    assert.deepStrictEqual(result, { parseResult: null, source: null });
  });

  it('should return a schedule given a valid asg', () => {
    let result = getScheduleByAsg(createValidAsg(), () => 'pretend schedule');
    assert.ok(result.parseResult);
    assert.ok(result.source);
  });

  it('should return the result of a parsed shedule', () => {
    let parser = () => 'schedule result';
    let spyParser = sinon.spy(parser);
    let result = getScheduleByAsg(createValidAsg(), spyParser);
    assert.equal(result.parseResult, 'schedule result');
    assert.ok(spyParser.called);
  });
});

function createValidAsg() {
  let asg = tagHelper.createTaggedObject();
  tagHelper.addTag(asg, 'schedule', 'stop: 27 16 21 10 * 2016');
  return asg;
}
