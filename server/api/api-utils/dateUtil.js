'use strict';

function beginningOfToday() {
  let today = new Date();
  today.setHours(0,0,0,0);
  return toDynamoFormat(today);
}

function toDynamoFormat(date) {
  return date.toISOString();
}

module.exports = { beginningOfToday, toDynamoFormat };