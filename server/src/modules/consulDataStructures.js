'use strict';

let { defaultTo, flow, get, groupBy, map, mapValues } = require('lodash/fp');

function tagsOf(item) {
  function parseTag(str) {
    let sepIdx = str.indexOf(':');
    return [str.slice(0, sepIdx), str.slice(sepIdx + 1)];
  }
  return flow(
    get('Tags'),
    map(parseTag),
    groupBy(([key]) => key),
    mapValues(flow(
      map(([, value]) => value))))(item);
}

let valueOfTag = key => flow(tagsOf, get(key), defaultTo([]));

module.exports = {
  tagsOf,
  valueOfTag
};
