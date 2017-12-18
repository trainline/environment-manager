'use strict';

/**
 * Merge the values of each property of the arguments into the corresponding property of the output.
 * The value of each property of the returned object is the array of values of the same property of each argument object.
 * @param {*} objects
 */

function merge(...objects) {
  let result = objects
    .filter(x => x !== undefined && x !== null)
    .reduce((acc, nxt) => {
      if (typeof nxt !== 'object') {
        throw new Error('Each argument must be an object');
      }
      Object.keys(nxt).forEach((key) => {
        if (acc[key] === undefined) {
          acc[key] = [nxt[key]];
        } else {
          acc[key].unshift(nxt[key]);
        }
      });
      return acc;
    }, {});
  Object.keys(result).forEach((key) => {
    let value = result[key];
    if (value.length === 1) {
      result[key] = value[0];
    }
  });
  return result;
}

module.exports = merge;
