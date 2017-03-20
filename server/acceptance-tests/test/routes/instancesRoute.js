/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should  = require('should');
let request = require('supertest');
let helper = require('../utils/testHelper');

describe('Querying [instances] resource', function() {

  before(helper.startServer);

  var apiError    = null;
  var apiResponse = null;

  before(function(done) {

    request('http://localhost:8080')
      .get('/api/sandbox/instances?tag-key=Role&tag-value=EnvironmentManager')
      .set('cookie', helper.cookie.create())
      .end(function(error, response) {
        apiError = error;
        apiResponse = response;
        done();
      });

  });

  it('Api should return 200', function(done) {

    should(apiError).be.Null();
    apiResponse.status.should.equal(200);
    done();

  }); // <-- Api should return 200

  // This was failing before we broke the app
  xit('Should contain instance information', function(done) {
    should(apiResponse).be.not.Null();
    should(apiResponse.body).be.not.Null();
    should(apiResponse.body.length).be.equal(1);
    should(apiResponse.body[0].Tags).matchAny({Key:'Role', Value: 'EnvironmentManager'});
    done();
  }); // <-- Should contain instance information

  after(helper.stopServer);

}); // <-- Querying [instances] resource
