/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var helper  = require('./testHelper'),
    request = require('supertest');

module.exports = {
  iGet: (uri, callback) => {

    var result = {};

    before(`Calling [GET] "${uri}" API endpoint`, (done) => {

      request('http://localhost:8080')
        .get(uri)
        .set('Authorization', helper.bearerToken)
        .end(function(error, response) {
          if (error) throw error;

          result.status  = response.status;
          result.message = response.text;
          result.data    = response.body;

          if (result.status == 500) console.log('[Internal server error]: ', result.message);

          done();

        });

    });

    describe(`Calling [GET] "${uri}" API endpoint`, () => { callback(result); });
  },
  iPut: (uri, data, callback) => {

    if (typeof data == 'function') {
      callback = data;
      data = undefined;
    };

    var result = {};

    before(`Calling [PUT] "${uri}" API endpoint`, (done) => {

      request('http://localhost:8080')
        .put(uri)
        .send(data)
        .set('Authorization', helper.bearerToken)
        .end(function(error, response) {
          if (error) throw error;

          result.status  = response.status;
          result.message = response.text;
          result.data    = response.body;

          if (result.status == 500) console.log('[Internal server error]: ', result.message);

          done();

        });

    });

    describe(`Calling [PUT] "${uri}" API endpoint`, () => { callback(result); });
  },
  iPost: (uri, data, callback) => {

    if (typeof data === 'function') {
      callback = data;
      data = undefined;
    };

    var result = {};

    before(`Calling [POST] "${uri}" API endpoint`, (done) => {

      request('http://localhost:8080')
        .post(uri)
        .send(data)
        .set('Authorization', helper.bearerToken)
        .end(function(error, response) {
          if (error) throw error;

          result.status  = response.status;
          result.message = response.text;
          result.data    = response.body;

          if (result.status == 500) console.log('[Internal server error]: ', result.message);

          done();

        });

    });

    describe(`Calling [POST] "${uri}" API endpoint`, () => { callback(result); });
  },
  iDelete: (uri, data, callback) => {

    if (typeof data === 'function') {
      callback = data;
      data = undefined;
    };

    var result = {};

    before(`Calling [DELETE] "${uri}" API endpoint`, (done) => {

      request('http://localhost:8080')
        .delete(uri)
        .send(data)
        .set('Authorization', helper.bearerToken)
        .end(function(error, response) {
          if (error) throw error;

          result.status  = response.status;
          result.message = response.text;
          result.data    = response.body;

          if (result.status == 500) console.log('[Internal server error]: ', result.message);

          done();

        });

    });

    describe(`Calling [DELETE] "${uri}" API endpoint`, () => { callback(result); });
  }
};
