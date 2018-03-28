'use strict';

const sut = require('../../modules/logger').createLogEntryDetails;
const assert = require('assert');

describe.only('logger module', () => {

  it('entry should contain the correct severity', () => {
    let entry = sut('warn');
    assert.equal(entry.severity, 'warn');
    entry = sut('info');
    assert.equal(entry.severity, 'info');
  });

  it('should handle errors being passed in', () => {
    let err = new Error('Bang!');
    let entry = sut('info', err);
    assert.equal(entry.message, err.message);
    assert(entry.details.includes(err.message));
  });

  it('should handle objects being passed in', () => {
    let entry = sut('info', { message: 'message info', somethingElse: 'more data' });
    assert.equal(entry.message, 'message info');
    assert.ok(entry.details.includes('somethingElse'));
    assert.ok(entry.details.includes('more data'));
  });

  it('should handle arbitrary numbers of arguments', () => {
    let entry = sut('info', 'something', 'something2', { anObjectKey: 'anObjectValue' });
    assert.equal(entry.message, 'something');
    assert(entry.details.includes('something2'));
    assert(entry.details.includes('anObjectKey'));
    assert(entry.details.includes('anObjectValue'));
  });

  it('should place [message], [trace-id] and [eventtype] as top level properties', () => {
    let entry = sut('info', {
      message: 'message value',  // eslint-disable-line quote-props
      eventtype: 'eventtype value', // eslint-disable-line quote-props
      notTop: 'child value', // eslint-disable-line quote-props
      'trace-id': 'trace-id value'
    });
    assert(entry.message);
    assert(entry['trace-id']);
    assert(entry.eventtype);

    // Others are NOT top level entries
    assert(!entry.notTop);
  });
});
