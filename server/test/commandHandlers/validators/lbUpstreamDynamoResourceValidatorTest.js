/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let upstreamValidator = require('commands/validators/lbUpstreamValidator');

describe('Upstream validation', () => {

    describe('Testing for valid upstream host port numbers', () => {

        var upstream, account, services;

        before('Setup basic upstream', () => {
            upstream = {
                Value: {
                    Hosts: [
                        { DnsName: 'something-valid.asgprod.local' }
                    ]
                }
            };
            account = {
                IsProd: true
            };
            services = [];
        });


        it('Does not validate ports if no services were found', () => {
            var result = upstreamValidator.validate(upstream, account, services);
            should(result.isValid).ok();
        });

        it('Does not validate ports if more than one service was found (ambiguous)', () => {
            var result = upstreamValidator.validate(upstream, account, services);
            should(result.isValid).ok();
        });

        it('Does not validate ports if no blue port is specified for the service', () => {
            services.push({ Value: { BluePort: '40108' } });
            var result = upstreamValidator.validate(upstream, account, services);
            should(result.isValid).ok();
        });

        it('Does not validate ports if no green port is specified for the service', () => {
            services.push({ Value: { GreenPort: '40108' } });
            var result = upstreamValidator.validate(upstream, account, services);
            should(result.isValid).ok();
        });

        it('Does not validate ports if no port is specified for the host', () => {
            services = [{ Value: { GreenPort: '40108', BluePort: '40109' } }];
            var result = upstreamValidator.validate(upstream, account, services);
            should(result.isValid).ok();
        });

        it('Port validation fails if the host port is not equal to either blue/green port for the service', () => {
            services = [{ Value: { GreenPort: '40108', BluePort: '40109' } }];
            upstream.Value.Hosts[0].Port = 3;
            var result = upstreamValidator.validate(upstream, account, services);
            should(result.isValid).not.ok();
        });

        it('Port validation failure error message is returned', () => {
            services = [{
                Value: { GreenPort: '40108', BluePort: '40109' },
                ServiceName: 'TestService'
            }];
            upstream.Value.Hosts[0].Port = 6;
            var result = upstreamValidator.validate(upstream, account, services);
            should(result.isValid).not.ok();
            should(result.err).be.equal('Host port 6 does not match blue or green port of TestService');
        });

        it('Port validation passes if the host port is equal to the blue port for the service', () => {
            services = [{ Value: { GreenPort: '40108', BluePort: '40109' } }];
            upstream.Value.Hosts[0].Port = 40109;
            var result = upstreamValidator.validate(upstream, account, services);
            should(result.isValid).ok();
        });

        it('Port validation passes if the host port is equal to the green port for the service', () => {
            services = [{ Value: { GreenPort: '40108', BluePort: '40109' } }];
            upstream.Value.Hosts[0].Port = '40108';
            var result = upstreamValidator.validate(upstream, account, services);
            should(result.isValid).ok();
        });

    });

    describe('Testing for valid upstream host names', () => {

        var upstream, account;

        var validateUpstreamWithHostWithDnsName = function (dnsName) {
            upstream.Value.Hosts = [{ DnsName: dnsName }];
            return upstreamValidator.validate(upstream, account);
        };

        before('Setup basic upstream', () => {
            upstream = {
                Value: {
                    Hosts: []
                }
            };
            account = {};
        });

        describe('Basic tests', () => {

            it('Ignores the dns collection validation if we don\'t know if it\'s prod or not', () => {
                upstream.Value.Hosts.push({ DnsName: 'something-valid.google.com' });
                delete account.IsProd

                var result = upstreamValidator.validate(upstream, account);
                should(result.isValid).ok();
            });

        });

        describe('Valid consul service names', () => {

            var validConsulNames = [
                'env-serviceName',
                'env-serviceName-blue'
            ];

            validConsulNames.forEach(dnsName => {

                it(dnsName, () => {
                    var result = validateUpstreamWithHostWithDnsName(dnsName);
                    should(result.isValid).ok();
                });

            });

        });

        describe('Valid dns names', () => {

            before('Non production account', () => {
                account.IsProd = true;
            });

            var validDnsNames = [
                'with-some-lovely-hyphens.asgprod.local',
                'contains-1-number.asgprod.local',
                'contains-UPPER-CASE.asgprod.local'
            ];

            validDnsNames.forEach(dnsName => {

                it(dnsName, () => {
                    var result = validateUpstreamWithHostWithDnsName(dnsName);
                    should(result.isValid).ok();
                });

            });

        });

        describe('Invalid dns names', () => {

            var invalidDnsNames = [
                { dnsName: '-starting-hyphen.asgprod.local', message: '"-starting-hyphen.asgprod.local" is not valid as sub domains must not begin or end with a hyphen' },
                { dnsName: 'ending-hyphen-.asgprod.local', message: '"ending-hyphen-.asgprod.local" is not valid as sub domains must not begin or end with a hyphen' },
                { dnsName: 'has-far-too-many-hyphens.asgprod.local', message: '"has-far-too-many-hyphens.asgprod.local" is not valid as sub domains must not contain more than 3 hyphens' },
                { dnsName: 'contains-ill$gal-ch@rs.asgprod.local', message: '"contains-ill$gal-ch@rs.asgprod.local" is not a valid as it contains illegal characters' },
                { dnsName: 'test', message: '"test" is not a valid as it contains no dots' },
            ];

            invalidDnsNames.forEach(testCase => {

                it(`${testCase.dnsName} - ${testCase.message}`, () => {
                    var result = validateUpstreamWithHostWithDnsName(testCase.dnsName);
                    should(result.isValid).not.ok();
                    should(result.err).be.equal(testCase.message);
                });

            });

        });

        describe('When the account is a production account', () => {

            before('Production account', () => {
                account.IsProd = true;
            });

            describe('Allowed dns names', () => {

                var validDnsNames = [
                    'something.asgprod.local',
                    'something.dmz-prod.trainline.com',
                    'something.int-prod.trainline.com',
                    'something.prod.local'
                ];

                validDnsNames.forEach(dnsName => {

                    it(dnsName, () => {
                        var result = validateUpstreamWithHostWithDnsName(dnsName);
                        should(result.isValid).ok();
                    });

                });

            });

        });

        describe('When the account is a non production account', () => {

            before('Non production account', () => {
                account.IsProd = false;
            });

            describe('Allowed dns names', () => {

                var validDnsNames = [
                    'something.asgtest.local',
                    'something.test.local',
                    'something.int-tst.ttl.local',
                    'something.dmz-tst.ttl.local',
                    'something.int-nonprod.trainline.com',
                    'something.dmz-nonprod.trainline.com',
                    'something.int-preprod.trainline.com',
                    'something.dmz-preprod.trainline.com'
                ];

                validDnsNames.forEach(dnsName => {

                    it(dnsName, () => {
                        var result = validateUpstreamWithHostWithDnsName(dnsName);
                        should(result.isValid).ok();
                    });

                });

            });

        });

    });

});

