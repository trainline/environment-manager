'use strict'

const expect = require('chai').expect;
const sinon = require('sinon');

const RateLimiter = require('./rateLimiter');

let createTaskSpy = () => {
  return sinon.spy(() => { return Promise.resolve(); });
}

describe('rate limiter', () => {

  let clock;

  before(function () { clock = sinon.useFakeTimers(); });
  after(function () { clock.restore(); });

  it('should call tasks immediately when under the limit', () => {

    let taskSpy = createTaskSpy();

    let rl = new RateLimiter(1);
    rl.queueTask(taskSpy);

    expect(taskSpy.calledOnce).to.be.true;

  });

  it('should delay execution when over the limit', () => {

    let task1Spy = createTaskSpy(),
        task2Spy = createTaskSpy();

    let rl = new RateLimiter(1);

    rl.queueTask(task1Spy);
    rl.queueTask(task2Spy);

    expect(task1Spy.called).to.be.true;
    expect(task2Spy.notCalled).to.be.true;

    clock.tick(1000);
    expect(task2Spy.called).to.be.true;

  });

});