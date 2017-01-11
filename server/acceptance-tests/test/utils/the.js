/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var helper  = require('./testHelper'),
    request = require('supertest');

module.exports = {
  dynamoDBTable: (tableName) => {

    return (callback) => {

      var result = {
        items: null
      };

      before(`Getting items from [${tableName}] DynamoDB table`, (done) => {

        helper.dynamo.getAll(tableName, (error, environments) => {
          if (error) throw error;
          result.items = environments;
          done();
        });

      });

      describe(`Getting items from [${tableName}] DynamoDB table`, () => { callback(result); });

    };

  }
};
