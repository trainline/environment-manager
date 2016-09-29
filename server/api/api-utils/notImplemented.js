'use strict';

function notImplemented (res, reason) {
  res.status(501);
  throw new Error(`Sorry, this action is not yet implemented: ${reason}`);
}

module.exports = notImplemented;