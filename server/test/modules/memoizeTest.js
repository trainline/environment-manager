'use strict';

let memoize = require('modules/memoize');
let should = require('should');
let sinon = require('sinon');

describe('memoize', function () {
    let typeInstances = [1, 's', {}, undefined, null, false,];
    context('when I try to memoize a value that is not a function', function () {
        typeInstances.forEach(instance => {
            it(`and it is a ${typeof instance} an error tells me I can only memoize a function.`, function () {
                (() => memoize(instance)).should.throw(/Can only memoize a function/);
            });
        });
    });
    context('when I memoize a function', function () {
        it('the result is a function', function () {
            memoize(() => undefined).should.be.Function();
        });
        it('the first call to the memoized function returns the same result as the un-memoized function', function () {
            let f = (x, y) => ({ x, y });
            let g = memoize(f);
            g(1, 'one').should.be.eql(f(1, 'one'));
        });
    });
    context('when I call the memoized function twice with the same arguments', function () {
        it('the un-memoized function is called once', function () {
            let f = sinon.spy(() => undefined);
            let g = memoize(f);
            g(1, 2);
            g(1, 2);
            f.calledOnce.should.be.true();
        });
        it('the second call returns the same result as the un-memoized function', function () {
            let f = (x, y) => ({ x, y });
            let g = memoize(f);
            g(1, 'one');
            g(1, 'one').should.be.eql(f(1, 'one'));
        });
        it('mutating the result of the first call does not affect the result of the second', function () {
            let f = (x, y) => ({ x, y });
            let g = memoize(f);
            let first = g(1, 'one');
            delete first.x;
            g(1, 'one').should.be.eql(f(1, 'one'));
        });
    });
    context('when I call the memoized function twice with different arguments', function () {
        it('the un-memoized function is called twice', function () {
            let f = sinon.spy(() => undefined);
            let g = memoize(f);
            g(1, 2);
            g(2, 1);
            f.calledTwice.should.be.true();
        });
        it('the second call returns the same result as the un-memoized function', function () {
            let f = (x, y) => ({ x, y });
            let g = memoize(f);
            g(1, 'one');
            g(1, 'two').should.be.eql(f(1, 'two'));
        });
    });
});
