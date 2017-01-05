/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should  = require('should');
let request = require('supertest');
let helper = require('../utils/testHelper');

describe('Routing', function() {

  before(helper.startServer);

  describe('Home page', function() {

    it('Should redirect to login page when no cookie is provided', function(done) {

      request('http://localhost:8080')
        .get('/')
        .end(function(error, response) {
          if(error) throw error;

          response.status.should.equal(302);
          response.res.text.should.containEql('Redirecting to /login');

          done();
        });

    }); // <--- it('Should redirect to login page when no cookie is provided')

    it('Should return home page when remember me cookie is provided', function(done) {

      var cookie = helper.cookie.create();

      request('http://localhost:8080')
        .get('/')
        .set('cookie', cookie)
        .end(function(error, response) {
          if(error) throw error;

          response.status.should.equal(200);

          done();
        });

    }); // <--- it('Should return home page when remember me cookie is provided')

  }); // <--- describe('Get')

  after(helper.stopServer);

}); // <--- describe('home')
