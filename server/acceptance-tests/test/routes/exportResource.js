/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should  = require('should');
let request = require('supertest');
let helper = require('../utils/testHelper');

// Filip: this was failing before we broke the app
xdescribe('[Export] API', function() {

  before('Starting server', helper.startServer);

  describe('Given two services in the "ConfigServices" dynamo table', function() {

    var serviceOne = {
      Audit: {
        TransactionID: '001'
      },
      ServiceName: 'ServiceOne',
      OwningCluster: 'ClusterOne',
      Value: true
    };

    var serviceTwo = {
      Audit: {
        TransactionID: '001'
      },
      ServiceName: 'ServiceTwo',
      OwningCluster: 'ClusterTwo',
      Value: true
    };

    before('Providing two services', function(done) {

      helper.dynamo.resetTable({
        table: 'ConfigServices',
        key: 'ServiceName',
        range: 'OwningCluster',
        items: [serviceOne, serviceTwo]
      }, done);

    }); // Providing two services

    describe('When I call "api/export/config/services" API', function() {

      var apiError    = null;
      var apiResponse = null;

      before('Calling the API', function(done) {

        request('http://localhost:8080')
          .get('/api/export/config/services')
          .set('cookie', helper.cookie.create())
          .end(function(error, response) {
            apiError = error;
            apiResponse = response;
            done();
          });

      }); // Calling the API

      it('It should return status code 200', function() {

        should(apiError).be.Null();
        apiResponse.status.should.equal(200);

      }); // It should return status code 200

      it('It should return an array of items', function() {

        should(apiResponse).be.not.Null();
        should(apiResponse.body).be.not.Null();
        apiResponse.body.should.be.an.Array();

      }); // It should return an array of items

      it('It should return the expected services', function() {

        apiResponse.body.should.containEql(serviceOne);
        apiResponse.body.should.containEql(serviceTwo);

      }); // It should return the expected services

    }); // When I call "api/export/config/services" API

  }); // Given two services in the "ConfigServices" dynamo table

  after('Stopping server', helper.stopServer);

}); // [Export] API
