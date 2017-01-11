/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function beginningOfToday() {
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  return toDynamoFormat(today);
}

function toDynamoFormat(date) {
  return date.toISOString();
}

module.exports = { beginningOfToday, toDynamoFormat };
