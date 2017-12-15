'use strict';

let when = (cond, fnTrue, fnFalse = () => null) =>
  x => (cond(x) ? fnTrue(x) : fnFalse(x));

let hasValue = x =>
  (x !== null && x !== undefined);

module.exports = {
  when,
  hasValue
};
