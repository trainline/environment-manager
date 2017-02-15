'use strict';

function load() {
  let DynamoHelper = require('./DynamoHelper');
  return DynamoHelper;
}

module.exports = { load };
