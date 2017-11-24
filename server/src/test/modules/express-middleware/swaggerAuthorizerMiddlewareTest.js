/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const inject = require('inject-loader!../../../modules/express-middleware/swaggerAuthorizerMiddleware');
require('should');
const sinon = require('sinon');
const apiSpec = require('../../../api/swagger-doc');


function createSut(authorizationFake) {
  let fakes = {
    '../authorization': authorizationFake
  };
  return inject(fakes)();
}

function loadSwaggerDocumentSync() {
  return apiSpec;
}

describe('swagger document', function () {
  describe('each x-authorizer referenced in the swagger document exists', function () {
    function extractXAuthorizers(swaggerDoc) {
      function loop(fragment) {
        if (typeof fragment === 'object' && fragment !== null) {
          return Object.keys(fragment).reduce((acc, key) => {
            let value = fragment[key];
            if (key === 'x-authorizer') {
              return [value, ...acc];
            } else {
              return [...loop(value), ...acc];
            }
          }, []);
        } else {
          return [];
        }
      }
      return loop(swaggerDoc).sort().reduce((acc, nxt) => {
        let [head] = acc;
        return head === nxt ? acc : [nxt, ...acc];
      }, []).reverse();
    }

    let swaggerDocument = loadSwaggerDocumentSync();
    let authorizers = extractXAuthorizers(swaggerDocument.paths);

    authorizers.filter(a => a !== 'allow-anonymous').forEach(function (authorizer) {
      it(`${authorizer}`, function () {
        let req = { swagger: { operation: { 'x-authorizer': authorizer } } };
        let authorization = sinon.spy(() => undefined);
        let next = sinon.spy(() => undefined);
        let sut = createSut(authorization);
        sut(req, undefined, next);
        sinon.assert.notCalled(next);
        sinon.assert.calledOnce(authorization);
        sinon.assert.alwaysCalledWith(authorization, sinon.match({ getRules: sinon.match.func }));
      });
    });
  });
  context('the x-authorizer "allow-anonymous"', function () {
    it('bypasses authentication', function () {
      let req = { swagger: { operation: { 'x-authorizer': 'allow-anonymous' } } };
      let authorization = sinon.spy(() => undefined);
      let next = sinon.spy(() => undefined);
      let sut = createSut(authorization);
      sut(req, undefined, next);
      sinon.assert.notCalled(authorization);
      sinon.assert.calledOnce(next);
    });
  });
  context('the empty x-authorizer', function () {
    it('is an alias for "simple"', function () {
      let req = { swagger: { operation: { } } };
      let authorization = sinon.spy(() => undefined);
      let next = sinon.spy(() => undefined);
      let sut = createSut(authorization);
      sut(req, undefined, next);
      sinon.assert.notCalled(next);
      sinon.assert.calledOnce(authorization);
      sinon.assert.alwaysCalledWith(authorization, sinon.match({ getRules: sinon.match.func }));
    });
  });
});
