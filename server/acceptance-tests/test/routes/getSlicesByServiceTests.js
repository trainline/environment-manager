/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var should  = require('should'),
    helper  = require('../utils/testHelper'),
    GIVEN   = require('../utils/given'),
    WHEN    = require('../utils/when');

describe(`Describing [slices] API`, () => {

  before(`Starting the server`, helper.startServer);

  describe(`to get slices by service`, () => {

    context(`when there is an active and inactive slice for "TheService" and "AnotherService" services in "sb1" and "sb2" environments`, () => {

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
        },
        {
          key: '/sb2_sb2-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb2',
            ServiceName: 'TheService',
            UpstreamName: 'sb2-TheService',
            Hosts: [
              { Port: 40101, State: 'up'   },
              { Port: 40102, State: 'down' }
            ]
          })
        },
        {
          key: '/sb2_sb2-AnotherService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb2',
            ServiceName: 'AnotherService',
            UpstreamName: 'sb2-AnotherService',
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

      WHEN.iGet("/api/sandbox/environments/sb1/services/TheService/slices", (response) => {

        it('it should return [OK] HTTP status code', () => {
          should(response.status).equal(200);
        });

        it('it should return an array of two slices', () => {
          should(response.data).Array();
          should(response.data.length).equal(2);
        });

        it('It should return "TheService" service slices in "sb1" environment', () => {
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

      }); // and I call "${getSlicesApiUri}" endpoint

      WHEN.iGet("/api/sandbox/environments/sb1/services/TheService/slices/active", (response) => {

        it('it should return [OK] HTTP status code', () => {
          should(response.status).equal(200);
        });

        it('it should return one active slice only', () => {
          should(response.data).Array();
          should(response.data.length).equal(1);
          response.data.should.matchAny({ Port: 40101, State: 'Active' });
        });

      });

      WHEN.iGet("/api/sandbox/environments/sb1/services/TheService/slices/inactive", (response) => {

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

    context(`when "TheService" service in "sb1" environment does not specify Blue/Green port numbers`, () => {

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

      WHEN.iGet("/api/sandbox/environments/sb1/services/TheService/slices", (response) => {

        it('It should return both slices named as "Unknown"', () => {
          should(response.data.length).equal(2);
          response.data.should.matchAny({ Port: 40101, Name: 'Unknown' });
          response.data.should.matchAny({ Port: 40102, Name: 'Unknown' });
        });

      });

    });

    context(`when there isn't any upstream for the requested one`, () => {

      GIVEN.upstreamsInDynamoDB([
        { // Same environment but different service
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
        { // Same service in a different environment
          key: '/sb2_sb2-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb2',
            ServiceName: 'TheService',
            UpstreamName: 'sb2-TheService',
            Hosts: [
              { Port: 40101, State: 'up' },
              { Port: 40102, State: 'down' }
            ]
          })
        }
      ]);

      WHEN.iGet("/api/sandbox/environments/sb1/services/TheService/slices", (response) => {

        it('it should return NotFound HTTP status code', () => {
          should(response.status).equal(404);
        });

      });

    });

  });

  after('Stopping the server', helper.stopServer);

}); // Describing [slices] API
