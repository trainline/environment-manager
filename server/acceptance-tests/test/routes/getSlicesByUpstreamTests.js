/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var should  = require('should'),
    helper  = require('../utils/testHelper'),
    GIVEN   = require('../utils/given'),
    WHEN    = require('../utils/when');

xdescribe(`Describing [slices] API`, () => {

  before(`Starting the server`, helper.startServer);

  describe(`to get slices by upstream`, () => {

    context(`when there is an active and inactive slice for "sb1-TheService" and "sb1-AnotherService" upstreams`, () => {

      GIVEN.upstreamsInDynamoDB([
        {
          key: '/sb1_sb1-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService',
            Hosts: [
              { Port: 40101, State: 'up'   },
              { Port: 40102, State: 'down' }
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
              { Port: 40201, State: 'up'   },
              { Port: 40202, State: 'down' }
            ]
          })
        }
      ]);

      GIVEN.servicesInDynamoDB([
        {
          ServiceName: 'TheService',
          OwningCluster: 'Infra',
          Value: { BluePort: 40101, GreenPort: 40102 }
        },
        {
          ServiceName: 'AnotherService',
          OwningCluster: 'Infra',
          Value: { BluePort: 40201, GreenPort: 40202 }
        }
      ]);

      WHEN.iGet("/api/sandbox/environments/sb1/upstreams/sb1-TheService/slices", (response) => {

        it('it should return [OK] HTTP status code', () => {
          should(response.status).equal(200);
        });

        it('it should return an array of two slices', () => {
          should(response.data).Array();
          should(response.data.length).equal(2);
        });

        it('It should return "sb1-TheService" upstream slices', () => {
          response.data.should.matchEach({ UpstreamName: 'sb1-TheService' });
          response.data.should.matchEach({ ServiceName: 'TheService' });
          response.data.should.matchEach({ EnvironmentName: 'sb1' });
        });

        it('It should return both active and inactive slices', () => {
          response.data.should.matchAny({ Port: 40101, State: 'Active' });
          response.data.should.matchAny({ Port: 40102, State: 'Inactive' });
        });

        it('It should return both blue and green slices', () => {
          response.data.should.matchAny({ Port: 40101, Name: 'Blue' });
          response.data.should.matchAny({ Port: 40102, Name: 'Green' });
        });

      });

      WHEN.iGet("/api/sandbox/environments/sb1/upstreams/sb1-TheService/slices/active", (response) => {

        it('it should return [OK] HTTP status code', () => {
          should(response.status).equal(200);
        });

        it('it should return one active slice only', () => {
          should(response.data).Array();
          should(response.data.length).equal(1);
          response.data.should.matchAny({ Port: 40101, State: 'Active' });
        });

      });

      WHEN.iGet("/api/sandbox/environments/sb1/upstreams/sb1-TheService/slices/inactive", (response) => {

        it('it should return [OK] HTTP status code', () => {
          should(response.status).equal(200);
        });

        it('it should return one inactive slice only', () => {
          should(response.data).Array();
          should(response.data.length).equal(1);
          response.data.should.matchAny({ Port: 40102, State: 'Inactive' });
        });

      });

    });

    context(`when "sb1-TheService" upstream does not refer to any service`, () => {

      GIVEN.upstreamsInDynamoDB([
        {
          key: '/sb1_sb1-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: undefined,
            UpstreamName: 'sb1-TheService',
            Hosts: [
              { Port: 40101, State: 'up' },
              { Port: 40102, State: 'down' }
            ]
          })
        }
      ]);

      WHEN.iGet("/api/sandbox/environments/sb1/upstreams/sb1-TheService/slices", (response) => {

        it('It should return both slices named as "Unknown"', () => {
          should(response.data.length).equal(2);
          response.data.should.matchAny({ Port: 40101, Name: 'Unknown' });
          response.data.should.matchAny({ Port: 40102, Name: 'Unknown' });
        });

      });

    });

    context(`when "sb1-TheService" upstream refers to "TheService" service which does not specify Blue/Green port numbers`, () => {

      GIVEN.upstreamsInDynamoDB([
        {
          key: '/sb1_sb1-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService',
            Hosts: [
              { Port: 40101, State: 'up' },
              { Port: 40102, State: 'down' }
            ]
          })
        }
      ]);

      GIVEN.servicesInDynamoDB([
        {
          ServiceName: 'TheService',
          OwningCluster: 'Infra',
          Value: { BluePort: undefined, GreenPort: undefined }
        }
      ]);

      WHEN.iGet("/api/sandbox/environments/sb1/upstreams/sb1-TheService/slices", (response) => {

        it('It should return both slices named as "Unknown"', () => {
          should(response.data.length).equal(2);
          response.data.should.matchAny({ Port: 40101, Name: 'Unknown' });
          response.data.should.matchAny({ Port: 40102, Name: 'Unknown' });
        });

      });

    });

    context(`when there isn't any upstream for the requested one`, () => {

      GIVEN.upstreamsInDynamoDB([
        { // Different upstream in the same environment
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
        { // Same upstream in different environment
          key: '/sb2_sb1-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb2',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService',
            Hosts: [
              { Port: 40201, State: 'up' },
              { Port: 40202, State: 'down' }
            ]
          })
        }
      ]);

      WHEN.iGet("/api/sandbox/environments/sb1/upstreams/sb1-TheService/slices", (response) => {

        it('it should return NotFound HTTP status code', () => {
          should(response.status).equal(404);
        });

      });

    });

  });

  after('Stopping the server', helper.stopServer);

});
