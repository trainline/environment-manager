/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

function notImplemented (res, reason) {
  res.status(501);
  throw new Error(`Sorry, this action is not yet implemented: ${reason}`);
}

module.exports = notImplemented;