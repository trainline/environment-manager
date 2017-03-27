/**
 * Attach the duct-tape that keeps the wings on ;-)
 */

'use strict';

/**
 * Return a deep copy of item with only properties for which
 * filter returns true.
 * @param {function} filter
 * @param {*} item
 */
function recursivelyRemoveProperties(filter, item) {
  function loop(i) {
    if (typeof i !== 'object' || i === null) {
      return i;
    } else if (Array.isArray(i)) {
      return i.filter(filter.bind(null, null)).map(loop);
    } else if (i instanceof Date) {
      let t = new Date();
      t.setTime(i.getTime());
      return t;
    } else {
      return Object.keys(i).reduce((acc, key) => {
        let value = i[key];
        if (filter(key, value)) {
          acc[key] = loop(i[key]);
        }
        return acc;
      }, {});
    }
  }
  return loop(item);
}

/**
 * DynamoDB cannot store the empty string or undefined as property values
 * @param {string} name
 * @param {*} value
 */
function dynamoCanStoreProperty(name, value) {
  return value !== undefined && value !== '';
}

module.exports = {
  makeWritable: recursivelyRemoveProperties.bind(null, dynamoCanStoreProperty)
};
