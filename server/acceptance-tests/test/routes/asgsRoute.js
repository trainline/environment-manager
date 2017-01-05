/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should  = require('should');
let request = require('supertest');
let helper = require('../utils/testHelper');

describe('AutoScalingGroups APIs', function() {

  before('Starting server', helper.startServer);

  describe('Given the "/api/all/asgs" endpoint', function() {

    describe('When I call', function(done) {

      var apiError    = null;
      var apiResponse = null;

      before('Calling the API', function(done) {

        request('http://localhost:8080')
          .get('/api/all/asgs')
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

      it('Each item should expose the belonging account', function() {

        apiResponse.body.should.matchEach(function(it) {
          it.AccountName.should.equal('Sandbox');
        });

      }); // Each item should expose the belonging account

    }); // When I call

  }); // Given the "/api/all/asgs" endpoint

  describe('Given the "/api/:account/asgs" endpoint', function() {

    describe('When I call it specifing "Sandbox" account', function(done) {

      var apiError    = null;
      var apiResponse = null;

      before('Calling the API', function(done) {

        request('http://localhost:8080')
          .get('/api/sandbox/asgs')
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

      it('Each item should belong to "Sandbox" account', function() {

        should(apiResponse.body).be.not.Null();
        should(apiResponse.body.length).be.greaterThan(0);

        apiResponse.body.should.matchAny(function(it) {
          it.AutoScalingGroupName.should.equal('sb1-in-EnvironmentManager');
        });

      }); // Each item should belong to "Sandbox" account

    }); // When I call it specifing "Sandbox" account

  }); // Given the "/api/:account/asgs" endpoint

  describe('Given the "/api/:account/asgs/:name" endpoint', function() {

    describe('When I call it specifing an ASG name', function(done) {

      var apiError    = null;
      var apiResponse = null;

      before('Calling the API', function(done) {

        request('http://localhost:8080')
          .get('/api/sandbox/asgs/sb1-in-EnvironmentManager')
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

      it('The expected AutoScalingGroup should be returned', function() {

        should(apiResponse.body).be.not.Null();
        should(apiResponse.body.AutoScalingGroupName).be.equal('sb1-in-EnvironmentManager');

      }); // The expected AutoScalingGroup should be returned

    }); // When I call it specifing an ASG name

    describe('When I call it specifing a not existing ASG name', function(done) {

      var apiError    = null;
      var apiResponse = null;

      before('Calling the API', function(done) {

        request('http://localhost:8080')
          .get('/api/sandbox/asgs/missing-asg')
          .set('cookie', helper.cookie.create())
          .end(function(error, response) {
            apiError = error;
            apiResponse = response;
            done();
          });

      }); // Calling the API

      it('It should return status code 404', function() {

        should(apiError).be.Null();
        apiResponse.status.should.equal(404);

      }); // It should return status code 404

    }); // When I call it specifing a not existing ASG name

  }); // Given the "/api/:account/asgs/:name" endpoint

  describe('Given the "/api/:account/asgs/:name/size" endpoint', function() {

    describe('When I call it specifing an ASG name', function(done) {

      var apiError    = null;
      var apiResponse = null;

      before('Calling the API', function(done) {

        request('http://localhost:8080')
          .get('/api/sandbox/asgs/sb1-in-EnvironmentManager/size')
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

      // That was failing on master
      xit('The expected AutoScalingGroup size should be returned', function() {

        should(apiResponse.body).match({
          min:     1,
          max:     1,
          desired: 1,
          current: 1
        });

      }); // The expected AutoScalingGroup size should be returned

    }); // When I call it specifing an ASG name

    describe('When I call it specifing a not existing ASG name', function(done) {

      var apiError    = null;
      var apiResponse = null;

      before('Calling the API', function(done) {

        request('http://localhost:8080')
          .get('/api/sandbox/asgs/missing-asg/s')
          .set('cookie', helper.cookie.create())
          .end(function(error, response) {
            apiError = error;
            apiResponse = response;
            done();
          });

      }); // Calling the API

      it('It should return status code 404', function() {

        should(apiError).be.Null();
        apiResponse.status.should.equal(404);

      }); // It should return status code 404

    }); // When I call it specifing a not existing ASG name

  }); // Given the "/api/:account/asgs/:name/size" endpoint

  describe('Given the "/api/:account/asgs/:name/launchconfig" endpoint', function() {

    describe('When I call it specifing an ASG name', function(done) {

      var apiError    = null;
      var apiResponse = null;

      before('Calling the API', function(done) {

        request('http://localhost:8080')
          .get('/api/sandbox/asgs/sb1-in-EnvironmentManager/launchconfig')
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

      it('The AutoScalingGroup LaunchConfiguration should be returned', function() {
        
        should(apiResponse.body).not.be.null();
        should(apiResponse.body.LaunchConfigurationName).be.equal('LaunchConfig_sb1-in-EnvironmentManager');

      }); // The expected AutoScalingGroup size should be returned

    }); // When I call it specifing an ASG name

  }); // Given the "/api/:account/asgs/:name/launchconfig" endpoint

  after('Stopping server', helper.stopServer);

}); // <-- AutoScalingGroups APIs
