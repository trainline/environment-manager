'use strict';

let _ = require('lodash');

module.exports = function getTag(taggedObject, key) {
  let result = null;

  if (!taggedObject || !key) {
    return result;
  }

  if (taggedObject && taggedObject.Tags && Array.isArray(taggedObject.Tags)) {
    let tag = _.first(taggedObject.Tags.filter(
      t => t.Key.toLowerCase() === key.toLowerCase()
    ));
    if (tag && tag.Value) {
      result = tag.Value.trim();
    }
  }

  return result;
};
