/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should  = require('should');
let request = require('supertest');
let helper = require('../utils/testHelper');

var client = helper.dynamo.createClient();

xdescribe('Managing [services] resource', function() {

  before(helper.startServer);

  describe('Creating a new service', function() {

    var apiError    = null;
    var apiResponse = null;

    before(function(done) {

      request('http://localhost:8080')
        .post('/api/config/services/MyService/MyCluster')
        .send({Value: 5})
        .set('cookie', helper.cookie.create())
        .end(function(error, response) {
          apiError = error;
          apiResponse = response;
          done();
        });

    });

    // NOTE: 201 Is better
    it('Api should return 200', function(done) {

      should(apiError).be.Null();
      apiResponse.status.should.equal(200);
      done();

    }); // <-- Api should return 200

    it('Should be inserted into the storage', function(done) {

      var request = {
        TableName: helper.dynamo.getTableName('ConfigServices'),
        Key: { ServiceName: 'MyService', OwningCluster: 'MyCluster' }
      };

      client.get(request, function(error, data) {
        should(error).be.Null();
        should(data).be.not.Null();

        var service = data.Item;

        should(service).be.not.Null();
        service.ServiceName.should.equal('MyService');
        service.OwningCluster.should.equal('MyCluster');
        service.Value.should.equal(5);
        done();
      });

    }); // <-- Should be inserted into the storage

  }); // <-- Creating a new service

  describe('Getting an existing service', function() {

    var apiError    = null;
    var apiResponse = null;

    before(function(done) {

      request('http://localhost:8080')
        .get('/api/config/services/MyService/MyCluster')
        .set('cookie', helper.cookie.create())
        .end(function(error, response) {
          apiError = error;
          apiResponse = response;
          done();
        });

    });

    // NOTE: 201 Is better
    it('Api should return 200', function(done) {

      should(apiError).be.Null();
      apiResponse.status.should.equal(200);

      apiResponse.body.ServiceName.should.equal('MyService');
      apiResponse.body.OwningCluster.should.equal('MyCluster');
      apiResponse.body.Value.should.equal(5);

      done();

    }); // <-- Api should return 200

    it('Should be inserted into the storage', function(done) {

      var request = {
        TableName: helper.dynamo.getTableName('ConfigServices'),
        Key: { ServiceName: 'MyService', OwningCluster: 'MyCluster' }
      };

      client.get(request, function(error, data) {
        should(error).be.Null();
        should(data).be.not.Null();

        var service = data.Item;

        should(service).be.not.Null();
        service.ServiceName.should.equal('MyService');
        service.OwningCluster.should.equal('MyCluster');
        service.Value.should.equal(5);
        done();
      });

    }); // <-- Should be inserted into the storage

  }); // <-- Creating a new service

  describe('Updating an existing service', function() {

    var apiError    = null;
    var apiResponse = null;

    before(function(done) {

      request('http://localhost:8080')
        .put('/api/config/services/MyService/MyCluster')
        .send({Value: 10})
        .set('cookie', helper.cookie.create())
        .end(function(error, response) {
          apiError = error;
          apiResponse = response;
          done();
        });

    });

    // NOTE: 204 Is better
    it('Api should return 200', function(done) {

      should(apiError).be.Null();
      apiResponse.status.should.equal(200);
      done();

    }); // <-- Api should return 200

    it('Should be updated into the storage', function(done) {

      var request = {
        TableName: helper.dynamo.getTableName('ConfigServices'),
        Key: { ServiceName: 'MyService', OwningCluster: 'MyCluster' }
      };

      client.get(request, function(error, data) {
        should(error).be.Null();
        should(data).be.not.Null();

        var service = data.Item;

        should(service).be.not.Null();
        service.Value.should.equal(10);
        done();
      });

    }); // <-- Should be updated into the storage

  }); // <-- Creating a new service

  describe('Deleting an existing service', function() {

    var apiError    = null;
    var apiResponse = null;

    before(function(done) {

      request('http://localhost:8080')
        .delete('/api/config/services/MyService/MyCluster')
        .set('cookie', helper.cookie.create())
        .end(function(error, response) {
          apiError = error;
          apiResponse = response;
          done();
        });

    });

    // NOTE: 204 Is better
    it('Api should return 200', function(done) {

      should(apiError).be.Null();
      apiResponse.status.should.equal(200);
      done();

    }); // <-- Api should return 200

    it('Should be removed from the storage', function(done) {

      var request = {
        TableName: helper.dynamo.getTableName('ConfigServices'),
        Key: { ServiceName: 'MyService', OwningCluster: 'MyCluster' }
      };

      client.get(request, function(error, data) {
        should(error).be.Null();
        should.not.exist(data.Item);
        done();
      });

    }); // <-- Should be updated into the storage

  }); // <-- Creating a new service

  after(helper.stopServer);

}); // <-- Managing [services] resource
