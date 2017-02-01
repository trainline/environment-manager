/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function deleteMarkerFor(key) {
  return Object.assign({}, key, { __Deleted: true });
}

module.exports = {
  deleteMarkerFor
};
