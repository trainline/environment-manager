'use strict';

require('should');
let { format, parse } = require('modules/serviceName');

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
  describe('parse', function () {
    context('when given a valid environment qualified name', function () {
      let scenarios = [
        [['environment1-service1'], { environment: 'environment1', service: 'service1' }],
        [['environment1-service1-none'], { environment: 'environment1', service: 'service1' }],
        [['environment1-service1-blue'], { environment: 'environment1', service: 'service1', slice: 'blue' }]
      ];

      scenarios.forEach(([args, expected]) => it(`${args} should return ${expected}`, function () {
        parse(...args).should.eql(expected);
      }));
    });
    context('when given an invalid environment qualified name', function () {
      let scenarios = [
        [[undefined], /Environment-qualified service name must match/],
        [[null], /Environment-qualified service name must match/],
        [[1], /Environment-qualified service name must match/],
        [[{}], /Environment-qualified service name must match/],
        [['environment1'], /Environment-qualified service name must match/],
        [['environment1-service1-blue-green'], /Environment-qualified service name must match/]
      ];

      scenarios.forEach(([args, expected]) => it(`${args} should throw an error`, function () {
        (() => parse(...args)).should.throw(expected);
      }));
    });
  });
});
