'use strict';

const proxyquire = require('proxyquire');
const { test } = require('tap');

let {
  reduceG
} = proxyquire('.', { 'aws-sdk': {} });

function concurrencyCounter() {
  let count = 0;
  let maxCount = 0;
  return {
    countCalls(fn) {
      return (...args) => {
        count += 1;
        if (maxCount < count) { maxCount = count; }
        return fn(...args).then(x => { count -= 1; return x; });
      };
    },
    maxConcurrentCalls() { return maxCount; }
  }
}

function promisify(fn) {
  return (...args) => new Promise((resolve, reject) => {
    function cb(error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    }
    fn(...[...args, cb]);
  });
}


test('reduceG', t => {
  let f = ([...acc], nxt) => Promise.resolve().then(() => [[...acc, nxt], nxt]);
  return Promise.all([
    t.test(`returns the expected result for an empty generator`, t => {
      let gen = () => undefined;
      let expected = []
      return reduceG(f, [[]], gen).then(output => t.equivalent(output, expected))
    }),
    t.test(`returns the expected result for a non-empty generator`, t => {
      function gen(i) {
        if (i <= 0) {
          return Promise.resolve()
        } else {
          return Promise.resolve(i-1)
        }
      }
      let expected = [2, 1, 0]
      return reduceG(f, [[], 3], gen).then(output => t.equivalent(output, expected))
    })
  ]);
});
