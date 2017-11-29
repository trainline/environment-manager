/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let sinon = require('sinon');
let assert = require('assert');
let inject = require('inject-loader!../../api/controllers/user/userController');

describe('userController', function () {
  let sut;

  beforeEach(() => {
    let userService = {
      authenticateUser: (creds) => {
        if (creds.username === 'correct' && creds.password === 'correct') {
          return Promise.resolve(true);
        } else {
          return Promise.reject('wrong password');
        }
      },
      signOut: () => { return Promise.resolve(); }
    };

    let cookieConfiguration = {
      getCookieName: sinon.stub().returns('my-cookie-name'),
      getCookieDuration: sinon.stub().returns(10)
    };

    sut = inject({
      '../../../modules/user-service': userService,
      '../../../modules/authentications/cookieAuthenticationConfiguration': cookieConfiguration
    });
  });

  let res;
  beforeEach(() => {
    res = {
      cookie: sinon.stub(),
      clearCookie: sinon.stub(),
      send: sinon.stub(),
      json: sinon.stub()
    };
  });

  describe('.login()', () => {
    function createRequest(body) {
      return {
        swagger: {
          params: {
            body: {
              value: body
            }
          }
        }
      };
    }

    it('user should get authenticated with right credentials', () => {
      let req = createRequest({
        username: 'correct',
        password: 'correct'
      }, 20);

      return sut.login(req, res).then(() => {
        res.cookie.calledWith().should.be.true();
      });
    });

    it('user should not get authenticated with right credentials', (done) => {
      let req = createRequest({
        username: 'correct',
        password: 'incorrect'
      }, 20);

      sut.login(req, res)
        .then(() => {
          done('login should fail');
        }, (reason) => {
          assert.equal(reason, 'wrong password');
          done();
        });
    });
  });

  describe('.logout()', () => {
    it('cookies should be cleared', (done) => {
      let req = { cookies: {} };

      sut.logout(req, res)
        .then(() => {
          res.clearCookie.calledWith('my-cookie-name').should.be.true();
          res.json.calledWith({ ok: true }).should.be.true();
          done();
        });
    });
  });
});
