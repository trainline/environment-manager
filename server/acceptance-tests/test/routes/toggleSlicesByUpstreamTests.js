/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var should  = require('should'),
    helper  = require('../utils/testHelper'),
    GIVEN   = require('../utils/given'),
    WHEN    = require('../utils/when');

xdescribe(`Describing [slices] API`, () => {

  before(`Starting the server`, helper.startServer);

  describe(`to toggle slices by upstream`, () => {

    context(`when there is an active and inactive slice for "sb1-TheService" and "sb1-AnotherService" upstream in "sb1" environment`, () => {

        GIVEN.servicesInDynamoDB([
            {
                ServiceName: 'Unknown',
                OwningCluster: 'Infra',
                Value: { BluePort: undefined, GreenPort: undefined }
            },
            {
                ServiceName: 'TheService',
                OwningCluster: 'Infra',
                Value: { BluePort: 40101, GreenPort: 40102 }
            },
            {
                ServiceName: 'AnotherService',
                OwningCluster: 'Infra',
                Value: { BluePort: 40101, GreenPort: 40102 }
            }
        ]);

        GIVEN.upstreamsInDynamoDB([
        {
          key: '/sb1_sb1-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService',
            Hosts: [
              { Port: 40101, State: 'up'  , DnsName: 'sb1-in-TheService.asgtest.local'},
              { Port: 40102, State: 'down', DnsName: 'sb1-in-TheService.asgtest.local'}
            ]
          })
        },
        {
          key: '/sb1_sb1-AnotherService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'AnotherService',
            UpstreamName: 'sb1-AnotherService',
            Hosts: [
                { Port: 40201, State: 'up', DnsName: 'sb1-in-AnotherService.asgtest.local'},
                { Port: 40202, State: 'down', DnsName: 'sb1-in-AnotherService.asgtest.local'}
            ]
          })
        }
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/upstreams/sb1-TheService/slices/toggle", (response) => {

        var currentUpstreams = null;

        before('Reading changed upstreams', (done) => {

          helper.dynamo.getAll('ConfigLBUpstream', (error, upstreams) => {
            currentUpstreams = upstreams.map((upstream) => {
              upstream.Value = JSON.parse(upstream.value);
              delete upstream['value'];
              return upstream;
            });

            done();
          });

        });

        it('it should return [OK] HTTP status code', () => {
          should(response.status).equal(200);
        });

        it('it should a list of toggled upstreams', () => {
          should(response.data).match({ ToggledUpstreams: [ "sb1-TheService" ] });
        });

        it('"sb1-TheService" upstream should be toggled', () => {
          currentUpstreams.should.matchAny({
            Value: {
              UpstreamName: 'sb1-TheService',
              Hosts: [
                { Port: 40101, State: 'down' },
                { Port: 40102, State: 'up'   }
              ]
            }
          });
        });

        it('"sb1-AnotherService" upstream should not be toggled', () => {
          currentUpstreams.should.matchAny({
            Value: {
              UpstreamName: 'sb1-AnotherService',
              Hosts: [
                { Port: 40201, State: 'up'   },
                { Port: 40202, State: 'down' }
              ]
            }
          });
        });

      });

    });

    context(`when "sb1-TheService" upstream contains only one slice`, () => {

      GIVEN.upstreamsInDynamoDB([
        {
          key: '/sb1_sb1-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService',
            Hosts: [
                { Port: 40101, State: 'up', DnsName: 'sb1-in-TheService.asgtest.local'}
            ]
          })
        }
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/upstreams/sb1-TheService/slices/toggle", (response) => {

        var currentUpstreams = null;

        before('Reading changed upstreams', (done) => {

          helper.dynamo.getAll('ConfigLBUpstream', (error, upstreams) => {
            currentUpstreams = upstreams.map((upstream) => {
              upstream.Value = JSON.parse(upstream.value);
              delete upstream['value'];
              return upstream;
            });

            done();
          });

        });

        it('it should return [OK] HTTP status code', () => {
          should(response.status).equal(200);
        });

        it('"sb1-TheService" upstream should be toggled', () => {
          currentUpstreams.should.matchAny({
            Value: {
              UpstreamName: 'sb1-TheService',
              Hosts: [
                { Port: 40101, State: 'down'}
              ]
            }
          });
        });

      });

    });

    context(`when "sb1-TheService" upstream contains more than two slices`, () => {

      GIVEN.upstreamsInDynamoDB([
        {
          key: '/sb1_sb1-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService',
            Hosts: [
              { Port: 40101, State: 'up'   , DnsName: 'sb1-in-TheService-blue.asgtest.local'},
              { Port: 40101, State: 'down', DnsName: 'sb1-in-TheService-green.asgtest.local'},
              { Port: 40101, State: 'down', DnsName: 'sb1-in-TheService-red.asgtest.local'}
            ]
          })
        }
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/upstreams/sb1-TheService/slices/toggle", (response) => {

        var currentUpstreams = null;

        before('Reading changed upstreams', (done) => {

          helper.dynamo.getAll('ConfigLBUpstream', (error, upstreams) => {
            currentUpstreams = upstreams.map((upstream) => {
              upstream.Value = JSON.parse(upstream.value);
              delete upstream['value'];
              return upstream;
            });

            done();
          });

        });

        it('it should return [OK] HTTP status code', () => {
          should(response.status).equal(200);
        });

        it('"sb1-TheService" upstream should be toggled', () => {
          currentUpstreams.should.matchAny({
            Value: {
              UpstreamName: 'sb1-TheService',
              Hosts: [
                  { Port: 40101, State: 'down', DnsName: 'sb1-in-TheService-blue.asgtest.local' },
                  { Port: 40101, State: 'up', DnsName: 'sb1-in-TheService-green.asgtest.local' },
                  { Port: 40101, State: 'up', DnsName: 'sb1-in-TheService-red.asgtest.local' }
              ]
            }
          });
        });

      });

    });

    context(`when "sb1-TheService" upstream contains two slices both up`, () => {

      GIVEN.upstreamsInDynamoDB([
        {
          key: '/sb1_sb1-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService',
            Hosts: [
                { Port: 40101, State: 'up', DnsName: 'sb1-in-TheService.asgtest.local'},
                { Port: 40102, State: 'up', DnsName: 'sb1-in-TheService.asgtest.local'}
            ]
          })
        }
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/upstreams/sb1-TheService/slices/toggle", (response) => {

        var currentUpstreams = null;

        before('Reading changed upstreams', (done) => {

          helper.dynamo.getAll('ConfigLBUpstream', (error, upstreams) => {
            currentUpstreams = upstreams.map((upstream) => {
              upstream.Value = JSON.parse(upstream.value);
              delete upstream['value'];
              return upstream;
            });

            done();
          });

        });

        it('it should return [OK] HTTP status code', () => {
          should(response.status).equal(200);
        });

        it('"sb1-TheService" upstream should be toggled', () => {
          currentUpstreams.should.matchAny({
            Value: {
              UpstreamName: 'sb1-TheService',
              Hosts: [
                { Port: 40101, State: 'down' },
                { Port: 40102, State: 'down'   }
              ]
            }
          });
        });

      });

    });

    context(`when "sb1-TheService" upstream contains two slices both down`, () => {

      GIVEN.upstreamsInDynamoDB([
        {
          key: '/sb1_sb1-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService',
            Hosts: [
                { Port: 40101, State: 'down', DnsName: 'sb1-in-TheService.asgtest.local'},
              { Port: 40102, State: 'down', DnsName: 'sb1-in-TheService.asgtest.local'}
            ]
          })
        }
      ]);


      WHEN.iPut("/api/sandbox/environments/sb1/upstreams/sb1-TheService/slices/toggle", (response) => {

        var currentUpstreams = null;

        before('Reading changed upstreams', (done) => {

          helper.dynamo.getAll('ConfigLBUpstream', (error, upstreams) => {
            currentUpstreams = upstreams.map((upstream) => {
              upstream.Value = JSON.parse(upstream.value);
              delete upstream['value'];
              return upstream;
            });

            done();
          });

        });

        it('it should return [OK] HTTP status code', () => {
          should(response.status).equal(200);
        });

        it('"sb1-TheService" upstream should be toggled', () => {
          currentUpstreams.should.matchAny({
            Value: {
              UpstreamName: 'sb1-TheService',
              Hosts: [
                { Port: 40101, State: 'up' },
                { Port: 40102, State: 'up' }
              ]
            }
          });
        });

      });


    });

    context(`when there is no upstream named "sb1-TheService" in "sb1" environment`, () => {

      GIVEN.upstreamsInDynamoDB([
        {
          key: '/sb1_sb1-AnotherService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'AnotherService',
            UpstreamName: 'sb1-AnotherService',
            Hosts: [
              { Port: 40201, State: 'up' },
              { Port: 40202, State: 'down' }
            ]
          })
        },
        {
          key: '/sb2_sb1-TheService/config', // This is a wrong configuration but filtering enforces target upstream to belong to "sb1" environment anyway
          value: JSON.stringify({
            EnvironmentName: 'sb2',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService',
            Hosts: [
              { Port: 40101, State: 'up' },
              { Port: 40102, State: 'down' }
            ]
          })
        }
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/upstreams/sb1-TheService/toggle", (response) => {

        it('it should return NotFound HTTP status code', () => {
          should(response.status).equal(404);
        });

      });

    });

    context(`when two records for the same "sb1-TheService" upstream exist`, () => {

      GIVEN.upstreamsInDynamoDB([
        {
          key: '/sb1_sb1-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService',
            Hosts: [ ]
          })
        },
        {
          key: '/sb1_sb1-TheService/config-copy',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService',
            Hosts: [ ]
          })
        }
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/upstreams/sb1-TheService/slices/toggle", (response) => {

        it('it should return 409 Conflict because more than one item refers to the same upstream', () => {
          should(response.status).equal(409);
          should(response.message).containEql(`Upstream named "sb1-TheService" in "sb1" environment cannot be toggled because all following keys refer to it: /sb1_sb1-TheService/config, /sb1_sb1-TheService/config-copy.`);
        });

      });

    });

    context(`when "sb1-TheService" upstream does not contain any slice`, () => {

      GIVEN.upstreamsInDynamoDB([
        {
          key: '/sb1_sb1-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService',
            Hosts: [ ]
          })
        }
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/upstreams/sb1-TheService/slices/toggle", (response) => {

        it('it should return 409 Conflict because the upstream does not contain any slice', () => {
          should(response.status).equal(409);
          should(response.message).containEql(`Upstream named "sb1-TheService" which refers to "TheService" service in "sb1" environment cannot be toggled because it has no slice.`);
        });

      });

    });

  });

  after('Stopping the server', helper.stopServer);

});
