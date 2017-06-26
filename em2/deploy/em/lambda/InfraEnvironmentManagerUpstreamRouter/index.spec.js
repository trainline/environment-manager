/* eslint-env mocha */

'use strict'

const proxyquire = require('proxyquire').noCallThru();
require('should');
const { describe, it } = require('mocha');
const { check, gen } = require('mocha-testcheck');

let fromPairs = (acc, [k, v]) => { acc[k] = v; return acc; };
let toPairs = obj => Object.keys(obj).map(k => [k, obj[k]]);

describe('InfraEnvironmentManagerUpstreamRouter', function () {

  describe('convertToOldModel', function () {
    let { convertToNewModel, convertToOldModel, formatItem } = proxyquire('./index', { 'aws-sdk': {} });

    let scenarios = [
      ['Environment', 'EnvironmentName'],
      ['Service', 'ServiceName'],
      ['Upstream', 'UpstreamName'],
    ];
    scenarios.forEach(([oldName, newName]) =>
      it(`it renames ${oldName} to ${newName}`, function () {
        let result = convertToOldModel(formatItem({
          Audit: { Version: 0 },
          Environment: 'e',
          Service: 's',
          Upstream: 'u'
        }));
        result.should.match({ value: /"EnvironmentName":/ });
        result.should.match({ value: /"ServiceName":/ });
        result.should.match({ value: /"UpstreamName":/ });
      }));

    context('when converting to old format and back to new format', function () {
      let maybe = g => gen.oneOf([gen.undefined, gen.null, g]);
      let genInput = gen.object({
            AccountId: 'myaccount',
            Audit: gen.object({ Version: gen.posInt }),
            Environment: maybe(gen.string),
            Hosts: gen.array(gen.object(gen.JSONPrimitive)),
            Key: gen.string.notEmpty(),
            LoadBalancerGroup: 'myaccount',
            LoadBalancingMethod: maybe(gen.string),
            PersistenceMethod: maybe(gen.string),
            SchemaVersion: maybe(gen.int),
            Service: maybe(gen.string),
            SlowStart: maybe(gen.string),
            Upstream: gen.string.notEmpty(),
            UpStreamKeepalives: maybe(gen.int),
            ZoneSize: maybe(gen.string)
      })
      it('it returns the input object', check({ maxSize: 3 }, genInput, function (x) {
        let removeUndefined = xs => toPairs(xs).filter(([,v]) => v !== undefined).reduce(fromPairs, {});
        let input = formatItem(removeUndefined(x));
        convertToNewModel(convertToOldModel(input), () => 'myaccount').should.eql(input);
      }));
    });
  });

  describe('dynamoDbConverter', function () {
    let { formatItem, parseItem } = proxyquire('./index', { 'aws-sdk': {} });

    context('when converting to DynamoDB JSON and back to original JSON', function () {
      it('it returns the input object', check({ maxSize: 3 }, gen.JSON, function (x) {
        parseItem(formatItem(x)).should.eql(x);
      }));
    });

    context('when converting a Set of numbers to DynamoDB JSON', function () {
      it('it returns a DynamoDB NN', check(gen.uniqueArray(gen.number).notEmpty(), function (x) {
        formatItem({ X: new Set(x) }).should.match({ X: { NN: [] } });
      }));
    });

    context('when converting a Set of strings to DynamoDB JSON', function () {
      it('it returns a DynamoDB SS', check({ maxSize: 5 }, gen.uniqueArray(gen.string).notEmpty(), function (x) {
        formatItem({ X: new Set(x) }).should.match({ X: { SS: [] } });
      }));
    });

    context('when converting an empty Set DynamoDB JSON', function () {
      it('it returns a DynamoDB L', function () {
        formatItem({ X: new Set([]) }).should.match({ X: { L: [] } });
      });
    });

    context('when converting a Set of items of distinct types to DynamoDB JSON', function () {
      it('it returns a DynamoDB L', check(gen.uniqueArray(gen.JSONPrimitive, x => typeof (x), { minSize: 2 }), function (x) {
        formatItem({ X: new Set(x) }).should.match({ X: { L: [] } });
      }));
    });
  });
});