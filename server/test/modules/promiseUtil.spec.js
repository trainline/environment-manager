/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let promiseUtil = require('modules/promiseUtil');

describe('promiseUtil', () => {
  describe('.reversePromisify()', () => {

    function annoyingFunction(callback, param1, param2) {
      setTimeout(() => {
        callback(null, param1 + param2);
      });
    }

    function erroringAnnoyingFunction(callback, param1, param2, param3) {
      setTimeout(() => {
        callback(param1 + param2 + param3);
      });
    }

    let obj = {
      annoyingMethod: function (callback) {
        callback(null, this.prop);
      },
      prop: 10,
    };

    it('works for successful result', () => {
      let promise = promiseUtil.reversePromisify(annoyingFunction)('abc', 'def');
      promise.should.eventually.equal('abcdef');
    });

    it('returns rejected promise on error', () => {
      let promise = promiseUtil.reversePromisify(erroringAnnoyingFunction)('a1', 'b1', 'c1');
      promise.should.be.rejectedWith('a1b1c1');
    });

    it('works with context', () => {
      let promise = promiseUtil.reversePromisify(obj.annoyingMethod, {context: obj})();
      promise.should.eventually.equal(10);
    });

  });
});
