/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let should = require('should');
let upstreamValidator = require('../../../commands/validators/lbUpstreamValidator');

describe('Upstream validation', () => {
  describe('Testing for valid upstream host port numbers', () => {
    let upstream;

    before('Setup basic upstream', () => {
      upstream = {
        Value: {
          Hosts: [
            { DnsName: 'something-valid.asgprod.local' }
          ]
        }
      };
    });

    it('Does not validate ports if no services were found', () => {
      let result = upstreamValidator.validate(upstream, null);
      should(result.isValid).ok();
    });

    it('Does not validate ports if no blue port is specified for the service', () => {
      let result = upstreamValidator.validate(upstream, { Value: { GreenPort: '40108' } });
      should(result.isValid).ok();
    });

    it('Does not validate ports if no green port is specified for the service', () => {
      let result = upstreamValidator.validate(upstream, { Value: { BluePort: '40108' } });
      should(result.isValid).ok();
    });

    it('Does not validate ports if no port is specified for the host', () => {
      let result = upstreamValidator.validate(upstream, { Value: { GreenPort: '40108', BluePort: '40109' } });
      should(result.isValid).ok();
    });

    it('Port validation fails if the host port is not equal to either blue/green port for the service', () => {
      upstream.Value.Hosts[0].Port = 3;
      let result = upstreamValidator.validate(upstream, { Value: { GreenPort: '40108', BluePort: '40109' } });
      should(result.isValid).not.ok();
    });

    it('Port validation failure error message is returned', () => {
      let service = {
        Value: { GreenPort: '40108', BluePort: '40109' },
        ServiceName: 'TestService'
      };
      upstream.Value.Hosts[0].Port = 6;
      let result = upstreamValidator.validate(upstream, service);
      should(result.isValid).not.ok();
      should(result.err).be.equal('Host port 6 does not match blue or green port of TestService');
    });

    it('Port validation passes if the host port is equal to the blue port for the service', () => {
      let service = { Value: { GreenPort: '40108', BluePort: '40109' } };
      upstream.Value.Hosts[0].Port = 40109;
      let result = upstreamValidator.validate(upstream, service);
      should(result.isValid).ok();
    });

    it('Port validation passes if the host port is equal to the green port for the service', () => {
      let service = { Value: { GreenPort: '40108', BluePort: '40109' } };
      upstream.Value.Hosts[0].Port = '40108';
      let result = upstreamValidator.validate(upstream, service);
      should(result.isValid).ok();
    });
  });

  describe('Testing for valid upstream host names', () => {
    let upstream;

    let validateUpstreamWithHostWithDnsName = (dnsName) => {
      upstream.Value.Hosts = [{ DnsName: dnsName }];
      return upstreamValidator.validate(upstream);
    };

    before('Setup basic upstream', () => {
      upstream = {
        Value: {
          Hosts: []
        }
      };
    });

    describe('Valid consul service names', () => {
      let validConsulNames = [
        'env-serviceName',
        'env-serviceName-blue'
      ];

      validConsulNames.forEach((dnsName) => {
        it(dnsName, () => {
          let result = validateUpstreamWithHostWithDnsName(dnsName);
          should(result.isValid).ok();
        });
      });
    });
  });
});

