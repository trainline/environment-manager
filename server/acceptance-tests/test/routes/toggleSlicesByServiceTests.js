/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var should  = require('should'),
    helper  = require('../utils/testHelper'),
    GIVEN   = require('../utils/given'),
    WHEN    = require('../utils/when');

xdescribe(`Describing [slices] API`, () => {

  before(`Starting the server`, helper.startServer);

  describe(`to toggle slices by service`, () => {

    context(`when there is an active and inactive slice for "TheService" and "AnotherService" service in "sb1" and "sb2" environments`, () => {

        GIVEN.environmentsInDynamoDB([
            {
                EnvironmentName: 'sb1',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }, {
                EnvironmentName: 'sb2',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
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
                { Port: 40101, State: 'up', DnsName: 'sb1-in-TheService.asgtest.local'},
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
        },
        {
          key: '/sb2_sb2-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb2',
            ServiceName: 'TheService',
            UpstreamName: 'sb2-TheService',
            Hosts: [
                { Port: 40101, State: 'up', DnsName: 'sb2-in-TheService.asgtest.local'},
                { Port: 40102, State: 'down', DnsName: 'sb2-in-TheService.asgtest.local'}
            ]
          })
        }
      ]);

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
          Value: { BluePort: 40201, GreenPort: 40202 }
        }
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/services/TheService/slices/toggle", (response) => {

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

        it('upstream for "TheService" service in "sb1" environment should be toggled', () => {
          currentUpstreams.should.matchAny({
            Value: {
              EnvironmentName: 'sb1',
              ServiceName: 'TheService',
              Hosts: [
                { Port: 40101, State: 'down' },
                { Port: 40102, State: 'up'   }
              ]
            }
          });
        });

        it('upstream for "AnotherService" service in "sb1" environment should not be toggled', () => {
          currentUpstreams.should.matchAny({
            Value: {
              EnvironmentName: 'sb1',
              ServiceName: 'AnotherService',
              Hosts: [
                { Port: 40201, State: 'up'   },
                { Port: 40202, State: 'down' }
              ]
            }
          });
        });

        it('upstream for "TheService" service in "sb2" environment should not be toggled', () => {
          currentUpstreams.should.matchAny({
            Value: {
              EnvironmentName: 'sb2',
              ServiceName: 'TheService',
              Hosts: [
                { Port: 40101, State: 'up'   },
                { Port: 40102, State: 'down' }
              ]
            }
          });
        });

      });

    });

    context(`when there is an active and inactive slice for "TheService" service in two different upstreams`, () => {

        GIVEN.environmentsInDynamoDB([
            {
                EnvironmentName: 'sb1',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }, {
                EnvironmentName: 'sb2',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }
        ]);

      GIVEN.upstreamsInDynamoDB([
        {
          key: '/sb1_sb1-TheService-Offline/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService-Offline',
            Hosts: [
                { Port: 40101, State: 'up', DnsName: 'sb1-in-TheService.asgtest.local'},
                { Port: 40102, State: 'down', DnsName: 'sb1-in-TheService.asgtest.local'}
            ]
          })
        },
        {
          key: '/sb1_sb1-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb1',
            ServiceName: 'TheService',
            UpstreamName: 'sb1-TheService',
            Hosts: [
                { Port: 40101, State: 'down', DnsName: 'sb1-in-TheService.asgtest.local'},
                { Port: 40102, State: 'up', DnsName: 'sb1-in-TheService.asgtest.local'}
            ]
          })
        }
      ]);

      GIVEN.servicesInDynamoDB([
        {
          ServiceName: 'TheService',
          OwningCluster: 'Infra',
          Value: { BluePort: 40101, GreenPort: 40102 }
        }
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/services/TheService/slices/toggle", (response) => {

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
          should(response.data).match({ ToggledUpstreams: [ "sb1-TheService-Offline", "sb1-TheService" ] });
        });

        it('both upstreams for "TheService" service in "sb1" environment should be toggled', () => {
          currentUpstreams.should.matchAny({
            Value: {
              EnvironmentName: 'sb1',
              ServiceName: 'TheService',
              UpstreamName: 'sb1-TheService-Offline',
              Hosts: [
                { Port: 40101, State: 'down' },
                { Port: 40102, State: 'up'   }
              ]
            }
          });
          currentUpstreams.should.matchAny({
            Value: {
              EnvironmentName: 'sb1',
              ServiceName: 'TheService',
              UpstreamName: 'sb1-TheService',
              Hosts: [
                { Port: 40101, State: 'up' },
                { Port: 40102, State: 'down' }
              ]
            }
          });
        });


      });

    });

    context(`when there isn't any upstream for the requested service and environment`, () => {

        GIVEN.environmentsInDynamoDB([
            {
                EnvironmentName: 'sb1',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }, {
                EnvironmentName: 'sb2',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }
        ]);

      GIVEN.upstreamsInDynamoDB([
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
        },
        {
          key: '/sb2_sb2-TheService/config',
          value: JSON.stringify({
            EnvironmentName: 'sb2',
            ServiceName: 'TheService',
            UpstreamName: 'sb2-TheService',
            Hosts: [
                { Port: 40101, State: 'up', DnsName: 'sb2-in-AnotherService.asgtest.local'},
                { Port: 40102, State: 'down', DnsName: 'sb2-in-AnotherService.asgtest.local'}
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
        },
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/services/TheService/slices/toggle", (response) => {

        it('it should return NotFound HTTP status code', () => {
          should(response.status).equal(404);
        });

      });

    });

    context(`when upstream for "TheService" service in "sb1" environment does not contain any slice`, () => {

        GIVEN.environmentsInDynamoDB([
            {
                EnvironmentName: 'sb1',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }, {
                EnvironmentName: 'sb2',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }
        ]);

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

      GIVEN.servicesInDynamoDB([
        {
          ServiceName: 'TheService',
          OwningCluster: 'Infra',
          Value: { BluePort: 40101, GreenPort: 40102 }
        },
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/services/TheService/slices/toggle", (response) => {

        it('it should return 409 Conflict because the upstream does not contain any slice', () => {
          should(response.status).equal(409);
          should(response.message).containEql(`Upstream named "sb1-TheService" which refers to "TheService" service in "sb1" environment cannot be toggled because it has no slice.`);
        });

      });

    });

    context(`when "sb1-TheService" upstream contains only one slice`, () => {

        GIVEN.environmentsInDynamoDB([
            {
                EnvironmentName: 'sb1',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }, {
                EnvironmentName: 'sb2',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
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
                { Port: 40101, State: 'up', DnsName: 'sb1-in-TheService.asgtest.local'}
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
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/services/TheService/slices/toggle", (response) => {

        it('it should return 409 Conflict because the upstream has only one slice', () => {
          should(response.status).equal(409);
          should(response.message).containEql(`Upstream named "sb1-TheService" which refers to "TheService" service in "sb1" environment cannot be toggled because it has only one slice.`);
        });

      });

    });

    context(`when "sb1-TheService" upstream contains more than two slices`, () => {

        GIVEN.environmentsInDynamoDB([
            {
                EnvironmentName: 'sb1',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }, {
                EnvironmentName: 'sb2',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
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
                { Port: 40101, State: 'up', DnsName: 'sb1-in-TheService-blue.asgtest.local'},
                { Port: 40101, State: 'down', DnsName: 'sb1-in-TheService-green.asgtest.local'},
              { Port: 40101, State: 'down' , DnsName: 'sb1-in-TheService-red.asgtest.local'}
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
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/services/TheService/slices/toggle", (response) => {

        it('it should return 409 Conflict because the upstream has more than two slices', () => {
          should(response.status).equal(409);
          should(response.message).containEql(`Upstream named "sb1-TheService" which refers to "TheService" service in "sb1" environment cannot be toggled because it has more than two slices.`);
        });

      });

    });

    context(`when "sb1-TheService" upstream contains two slices both up`, () => {

        GIVEN.environmentsInDynamoDB([
            {
                EnvironmentName: 'sb1',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }, {
                EnvironmentName: 'sb2',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
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
                { Port: 40101, State: 'up', DnsName: 'sb1-in-TheService.asgtest.local'},
                { Port: 40102, State: 'up', DnsName: 'sb1-in-TheService.asgtest.local'}
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
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/services/TheService/slices/toggle", (response) => {

        it('it should return 409 Conflict because all upstream slices are active', () => {
          should(response.status).equal(409);
          should(response.message).containEql(`Upstream named "sb1-TheService" which refers to "TheService" service in "sb1" environment cannot be toggled because all its slices are "Active".`);
        });

      });

    });

    context(`when "sb1-TheService" upstream contains two slices both down`, () => {

        GIVEN.environmentsInDynamoDB([
            {
                EnvironmentName: 'sb1',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }, {
                EnvironmentName: 'sb2',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
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
                { Port: 40101, State: 'down', DnsName: 'sb1-in-TheService.asgtest.local'},
                { Port: 40102, State: 'down', DnsName: 'sb1-in-TheService.asgtest.local'}
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
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/services/TheService/slices/toggle", (response) => {

        it('it should return 409 Conflict because all upstream slices are inactive', () => {
          should(response.status).equal(409);
          should(response.message).containEql(`Upstream named "sb1-TheService" which refers to "TheService" service in "sb1" environment cannot be toggled because all its slices are "Inactive".`);
        });

      });

    });

    context(`when an upstream references to "TheService" service in "sb1" environment but the service does not specify blue/green port`, () => {

        GIVEN.environmentsInDynamoDB([
            {
                EnvironmentName: 'sb1',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }, {
                EnvironmentName: 'sb2',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
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
                { Port: 40101, State: 'up', DnsName: 'sb1-in-TheService.asgtest.local'},
                { Port: 40102, State: 'down', DnsName: 'sb1-in-TheService.asgtest.local'}
            ]
          })
        }
      ]);

      GIVEN.servicesInDynamoDB([
        {
          ServiceName: 'TheService',
          OwningCluster: 'Infra',
          Value: { BluePort: undefined, GreenPort: undefined }
        },
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/services/TheService/slices/toggle", (response) => {

        it('it should return 409 Conflict because there is no way to detect which slice is "blue".', () => {
          should(response.status).equal(409);
          should(response.message).containEql(`Upstream named "sb1-TheService" which refers to "TheService" service in "sb1" environment cannot be toggled because there is no way to detect which slice is "blue".`);
        });

      });

    });

    context(`when an upstream references to "TheService" service in "sb1" environment but the service specifies different blue/green port numbers`, () => {

        GIVEN.environmentsInDynamoDB([
            {
                EnvironmentName: 'sb1',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }, {
                EnvironmentName: 'sb2',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
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
                { Port: 40101, State: 'up', DnsName: 'sb1-in-TheService.asgtest.local'},
                { Port: 40102, State: 'down', DnsName: 'sb1-in-TheService.asgtest.local'}
            ]
          })
        }
      ]);

      GIVEN.servicesInDynamoDB([
        {
          ServiceName: 'TheService',
          OwningCluster: 'Infra',
          Value: { BluePort: 40201, GreenPort: 40202 }
        },
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/services/TheService/slices/toggle", (response) => {

        it('it should return 409 Conflict because there is no way to detect which slice is "blue".', () => {
          should(response.status).equal(409);
          should(response.message).containEql(`Upstream named "sb1-TheService" which refers to "TheService" service in "sb1" environment cannot be toggled because there is no way to detect which slice is "blue".`);
        });

      });

    });

    context(`when an upstream references to a not existing service "TheService"in "sb1" environment`, () => {

        GIVEN.environmentsInDynamoDB([
            {
                EnvironmentName: 'sb1',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
            }, {
                EnvironmentName: 'sb2',
                Value: { OwningCluster: 'test', EnvironmentType: 'test' }
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
                { Port: 40101, State: 'up', DnsName: 'sb1-in-TheService.asgtest.local'},
              { Port: 40102, State: 'down', DnsName: 'sb1-in-TheService.asgtest.local'}
            ]
          })
        }
      ]);

      WHEN.iPut("/api/sandbox/environments/sb1/services/TheService/slices/toggle", (response) => {

        it('it should return 409 Conflict because there is no way to detect which slice is "blue".', () => {
          should(response.status).equal(409);
          should(response.message).containEql(`Upstream named "sb1-TheService" which refers to "TheService" service in "sb1" environment cannot be toggled because there is no way to detect which slice is "blue".`);
        });

      });

    });

  });

  after('Stopping the server', helper.stopServer);

});
