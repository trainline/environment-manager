'use strict';

require('should');
let { format } = require('modules/serviceName');

describe('serviceName', function () {
  describe('format', function () {
    context('when given valid arguments', function () {
      let scenarios = [
        [['environment1', 'service1'], 'environment1-service1'],
        [['environment1', 'service1', null], 'environment1-service1'],
        [['environment1', 'service1', 'none'], 'environment1-service1'],
        [['environment1', 'service1', 'blue'], 'environment1-service1-blue'],
        [['environment1', 'service1', 'green'], 'environment1-service1-green']
      ];

      scenarios.forEach(([args, expected]) => it(`${args} should return ${expected}`, function () {
        format(...args).should.eql(expected);
      }));
    });
    context('when given invalid arguments', function () {
      let scenarios = [
        [['env-with-dashes', 'validService'], /environment/],
        [['', 'validService'], /environment/],
        [[undefined, 'validService'], /environment/],
        [[null, 'validService'], /environment/],
        [[{}, 'validService'], /environment/],
        [['validEnvironment', 'service-with-dashes'], /service/],
        [['validEnvironment', ''], /service/],
        [['validEnvironment', undefined], /service/],
        [['validEnvironment', null], /service/],
        [['validEnvironment', {}], /service/],
        [['validEnvironment', 'validService', 'slice-with-dashes'], /slice/],
        [['validEnvironment', 'validService', ''], /slice/]
      ];

      scenarios.forEach(([args, expected]) => it(`${args} should throw an error`, function () {
        (() => format(...args)).should.throw(expected);
      }));
    });
  });
});
