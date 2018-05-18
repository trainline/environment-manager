'use strict';

let schema = require('../../../client/schema/EnvironmentType.schema.json');
let Ajv = require('ajv');
let _ = require('lodash');
let assert = require('assert');
let sample = require('./environment-type.sample.json');

describe.only('environment-type schema validation', () => {

  let data, ajv, validate;

  beforeEach(() => {
    data = _.cloneDeep(sample);
    ajv = new Ajv();
    validate = ajv.compile(schema);
  });

  it('should enforce load balancer array exists', () => {
    data.LoadBalancers = null;
    fails();
  });

  it('should not allow more than 127 load balancers', () => {
    data.LoadBalancers = [_.range(0, 128).map(() => "x").join('')];
    fails();
  });

  it('should allow no load balancers', () => {
    data.LoadBalancers = [];
    succeeds();
  });

  it('should not allow duplicate load balancers', () => {
    data.LoadBalancers = ["1", "1"];
    fails();
  });

  it('should not allow duplicate consul servers', () => {
    data.Consul.Servers = ["10.249.17.254", "10.249.17.254"];
    fails();
  });

  it('should allow ips for consul servers', () => {
    data.Consul.Servers = ["10.249.17.254"];
    succeeds();
  });

  it('should allow dns for consul servers', () => {
    data.Consul.Servers = ["some.dns"];
    succeeds();
  });

  it('should not allow 0 consul servers', () => {
    data.Consul.Servers = [];
    fails();
  });

  it('should not allow empty consul servers', () => {
    data.Consul.Servers = [""];
    fails();
  });

  function test(expected) {
    let valid = validate(data)
    if (valid !== expected) console.log(validate.errors);
    assert.ok(valid === expected)
  }

  let succeeds = () => test(true);
  let fails = () => test(false);

});
