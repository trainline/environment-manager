'use strict';

require('should');
let sut = require('../../../modules/environment-state/healthReporter');

describe('healthReporter', function () {
  describe('desiredState', function () {
    context('when the desired size of the role is healthy', function () {
      it('the correct results are returned', function () {
        let desiredTopology = {
          'env1-svc1-blue': { environment: 'env1', roles: ['role1', 'role1-blue'], service: 'svc1', slice: 'blue' },
          'env1-svc1-green': { environment: 'env1', roles: ['role1', 'role1-green'], service: 'svc1', slice: 'green' }
        };
        let desiredCounts = {
          env1: {
            'role1': { desiredCount: 1 },
            'role1-blue': { desiredCount: 2 }
          }
        };
        return sut.desiredState(desiredTopology, desiredCounts).should.eql({
          'env1-svc1-blue': { environment: 'env1', roles: { 'role1': { desiredCount: 1 }, 'role1-blue': { desiredCount: 2 } }, service: 'svc1', slice: 'blue' },
          'env1-svc1-green': { environment: 'env1', roles: { 'role1': { desiredCount: 1 }, 'role1-green': { desiredCount: 0 } }, service: 'svc1', slice: 'green' }
        });
      });
    });
  });
  describe('currentState', function () {
    let nodeHealth = (Node, Service, passing = 1, failing = 0) => ({
      Node: {
        Node
      },
      Service: {
        Service
      },
      Checks: [
        ...Array.from({ length: passing }).map(() => ({ Status: 'passing' })),
        ...Array.from({ length: failing }).map(() => ({ Status: 'warning' }))
      ]
    });

    context('when a service is running on one role', function () {
      it('the service count is returned', function () {
        let health = [
          nodeHealth('node1', 'env1-svc1-blue')
        ];
        let instances = {
          node1: { role: 'role1', autoScalingGroup: 'asg1' }
        };

        return sut.currentState(health, instances).should.eql({
          'env1-svc1-blue':
          {
            roles: {
              role1: {
                'healthyCount': 1,
                'unhealthyCount': 0,
                'failing-checks': []
              }
            }
          }
        });
      });
    });

    context('when a service is deployed to two roles', function () {
      it('the service count is returned grouped by role', function () {
        let health = [
          nodeHealth('node-in-right-role', 'env1-svc1-blue'),
          nodeHealth('node-in-wrong-role', 'env1-svc1-blue', 1, 1),
          nodeHealth('node2-in-wrong-role', 'env1-svc1-blue', 1, 1)
        ];

        let instances = {
          'node-in-right-role': { role: 'role1-blue', autoScalingGroup: 'asg1' },
          'node-in-wrong-role': { role: 'role1', autoScalingGroup: 'asg1' },
          'node2-in-wrong-role': { role: 'role1', autoScalingGroup: 'asg1' }
        };

        return sut.currentState(health, instances).should.eql({
          'env1-svc1-blue': {
            roles: {
              'role1-blue': { 'failing-checks': [], 'healthyCount': 1, 'unhealthyCount': 0 },
              'role1': { 'failing-checks': [{ Status: 'warning' }, { Status: 'warning' }], 'healthyCount': 0, 'unhealthyCount': 2 }
            }
          }
        });
      });
    });

    context('when a service is deployed to an instance not in a role', function () {
      it('the role is set to the instance name', function () {
        let health = [
          nodeHealth('node-in-role', 'env1-svc1-blue', 1, 1),
          nodeHealth('node-not-in-role', 'env1-svc1-blue')
        ];

        let instances = {
          'node-in-role': { role: 'role1', autoScalingGroup: 'asg1' }
        };

        return sut.currentState(health, instances).should.eql({
          'env1-svc1-blue': {
            instances: {
              'node-not-in-role': { 'failing-checks': [], 'healthyCount': 1, 'unhealthyCount': 0 }
            },
            roles: {
              role1: { 'failing-checks': [{ Status: 'warning' }], 'healthyCount': 0, 'unhealthyCount': 1 }
            }
          }
        });
      });
    });

    context('when two services are running', function () {
      it('the role is set to the instance name', function () {
        let health = [
          nodeHealth('node1', 'env1-svc1-blue'),
          nodeHealth('node1', 'env1-svc1-green', 0, 1)
        ];

        let instances = {
          node1: { role: 'role1', autoScalingGroup: 'asg1' }
        };

        return sut.currentState(health, instances).should.eql({
          'env1-svc1-blue': {
            roles: {
              role1: { 'failing-checks': [], 'healthyCount': 1, 'unhealthyCount': 0 }
            }
          },
          'env1-svc1-green': {
            roles: {
              role1: { 'failing-checks': [{ Status: 'warning' }], 'healthyCount': 0, 'unhealthyCount': 1 }
            }
          }
        });
      });
    });
  });
  describe('desiredCountOf', function () {
    it('groups the auto scaling group sizes by environment and role', function () {
      let autoScalingGroups = [
        {
          DesiredCapacity: 1,
          Tags: [
            { Key: 'Environment', Value: 'env1' },
            { Key: 'Role', Value: 'role1' }
          ]
        },
        {
          DesiredCapacity: 1,
          Tags: [
            { Key: 'Environment', Value: 'env1' },
            { Key: 'Role', Value: 'role1' }
          ]
        },
        {
          DesiredCapacity: 1,
          Tags: [
            { Key: 'Environment', Value: 'env1' },
            { Key: 'Role', Value: 'role2' }
          ]
        },
        {
          DesiredCapacity: 1,
          Tags: [
            { Key: 'Environment', Value: 'env2' },
            { Key: 'Role', Value: 'role1' }
          ]
        }
      ];
      return sut.desiredCountOf(autoScalingGroups).should.eql({
        env1: {
          role1: { desiredCount: 2 },
          role2: { desiredCount: 1 }
        },
        env2: {
          role1: { desiredCount: 1 }
        }
      });
    });
  });
  describe('desiredTopologyOf', function () {
    it('groups the services by fully qualified name', function () {
      let getServerRolesResult = {
        EnvironmentName: 'env1',
        Value: [
          { Role: 'role1', Services: [{ Name: 'svc1', Slice: 'blue' }, { Name: 'svc1', Slice: 'green' }] },
          { Role: 'role1-blue', Services: [{ Name: 'svc1', Slice: 'blue' }] },
          { Role: 'role1-green', Services: [{ Name: 'svc1', Slice: 'green' }] }
        ]
      };
      return sut.desiredTopologyOf(getServerRolesResult).should.eql({
        'env1-svc1-blue': { environment: 'env1', roles: ['role1', 'role1-blue'], service: 'svc1', slice: 'blue' },
        'env1-svc1-green': { environment: 'env1', roles: ['role1', 'role1-green'], service: 'svc1', slice: 'green' }
      });
    });
  });
  describe('instancesOf', function () {
    it('returns the name, role and auto scaling group of the instances', function () {
      let describeInstancesResult = {
        Reservations: [
          {
            Instances: [
              {
                Tags: [
                  { Key: 'aws:autoscaling:groupName', Value: 'asg1' },
                  { Key: 'Role', Value: 'role1' },
                  { Key: 'Name', Value: 'server1' }
                ]
              },
              {
                Tags: [
                  { Key: 'aws:autoscaling:groupName', Value: 'asg2' },
                  { Key: 'Role', Value: 'role2' },
                  { Key: 'Name', Value: 'server2' }
                ]
              }
            ]
          },
          {
            Instances: [
              {
                Tags: [
                  { Key: 'aws:autoscaling:groupName', Value: 'asg1' },
                  { Key: 'Role', Value: 'role1' },
                  { Key: 'Name', Value: 'server3' }
                ]
              },
              {
                Tags: [
                  { Key: 'aws:autoscaling:groupName', Value: 'asg2' },
                  { Key: 'Role', Value: 'role2' },
                  { Key: 'Name', Value: 'server4' }
                ]
              }
            ]
          }
        ]
      };
      return sut.instancesOf(describeInstancesResult).should.eql({
        server1: { role: 'role1', autoScalingGroup: 'asg1' },
        server2: { role: 'role2', autoScalingGroup: 'asg2' },
        server3: { role: 'role1', autoScalingGroup: 'asg1' },
        server4: { role: 'role2', autoScalingGroup: 'asg2' }
      });
    });
  });
  describe('instancesRequestFor', function () {
    context('when given some health check results', function () {
      it('returns a unique set of instances per AWS account', function () {
        let health = [
          {
            Node: {
              Node: 'node1'
            },
            Service: {
              Tags: ['environment:env1a']
            }
          },
          {
            Node: {
              Node: 'node1'
            },
            Service: {
              Tags: ['environment:env1a']
            }
          },
          {
            Node: {
              Node: 'node1'
            },
            Service: {
              Tags: ['environment:env1b']
            }
          },
          {
            Node: {
              Node: 'node1'
            },
            Service: {
              Tags: ['environment:env2']
            }
          },
          {
            Node: {
              Node: 'node2'
            },
            Service: {
              Tags: ['environment:env2']
            }
          }
        ];
        let accountOf = (() => {
          let environments = { env1a: 'account1', env1b: 'account1', env2: 'account2' };
          return environment => Promise.resolve(environments[environment]);
        })();
        sut.instancesRequestFor(accountOf, health).should.finally.eql({
          account1: ['node1'],
          account2: ['node1', 'node2']
        });
      });
    });
    context('when given an empty array', function () {
      it('returns an empty object', function () {
        let health = [];
        let accountOf = (() => {
          let environments = { env1a: 'account1', env1b: 'account1', env2: 'account2' };
          return environment => Promise.resolve(environments[environment]);
        })();
        sut.instancesRequestFor(accountOf, health).should.finally.eql({});
      });
    });
  });
  describe('compare', function () {
    context('when the current state matches the desired state', function () {
      let desired = {
        'env1-svc1-blue': { environment: 'env1', roles: { 'role1': { desiredCount: 1 }, 'role1-blue': { desiredCount: 2 } }, service: 'svc1', slice: 'blue' },
        'env1-svc1-green': { environment: 'env1', roles: { 'role1': { desiredCount: 1 }, 'role1-green': { desiredCount: 0 } }, service: 'svc1', slice: 'green' }
      };
      let current = {
        'env1-svc1-blue': { roles: { 'role1': { 'failing-checks': [], 'healthyCount': 1, 'unhealthyCount': 0 }, 'role1-blue': { healthyCount: 2, unhealthyCount: 0 } } },
        'env1-svc1-green': { roles: { 'role1': { 'failing-checks': [], 'healthyCount': 1, 'unhealthyCount': 0 }, 'role1-green': { healthyCount: 0, unhealthyCount: 0 } } }
      };
      it('returns the health aggregated by server role', function () {
        return sut.compare(desired, current).should.eql([
          {
            name: 'env1-svc1-blue',
            environment: 'env1',
            orphanedInstances: [],
            roles: [
              { 'name': 'role1', 'failing-checks': [], 'desiredCount': 1, 'healthyCount': 1, 'unhealthyCount': 0 },
              { 'name': 'role1-blue', 'failing-checks': [], 'desiredCount': 2, 'healthyCount': 2, 'unhealthyCount': 0 }
            ],
            service: 'svc1',
            slice: 'blue'
          },
          {
            name: 'env1-svc1-green',
            environment: 'env1',
            orphanedInstances: [],
            roles: [
              { 'name': 'role1', 'failing-checks': [], 'desiredCount': 1, 'healthyCount': 1, 'unhealthyCount': 0 },
              { 'name': 'role1-green', 'failing-checks': [], 'desiredCount': 0, 'healthyCount': 0, 'unhealthyCount': 0 }
            ],
            service: 'svc1',
            slice: 'green'
          }
        ]);
      });
    });
    context('when the current state matches no desired state', function () {
      let desired = {};
      let current = {
        'env1-svc1-blue': { roles: { 'role1': { healthyCount: 1, unhealthyCount: 0 }, 'role1-blue': { healthyCount: 2, unhealthyCount: 0 } } }
      };
      it('returns the health assuming a desired size of 0', function () {
        return sut.compare(desired, current).should.eql([
          {
            name: 'env1-svc1-blue',
            orphanedInstances: [],
            roles: [
              { 'name': 'role1', 'failing-checks': [], 'desiredCount': 0, 'healthyCount': 1, 'unhealthyCount': 0 },
              { 'name': 'role1-blue', 'failing-checks': [], 'desiredCount': 0, 'healthyCount': 2, 'unhealthyCount': 0 }
            ]
          }
        ]);
      });
    });
    context('when the desired state matches no current state', function () {
      let desired = {
        'env1-svc1-blue': { environment: 'env1', roles: { 'role1': { desiredCount: 1 }, 'role1-blue': { desiredCount: 2 } }, service: 'svc1', slice: 'blue' }
      };
      let current = {};
      it('returns the health assuming 0 healthy and 0 unhealthy nodes', function () {
        return sut.compare(desired, current).should.eql([
          {
            name: 'env1-svc1-blue',
            environment: 'env1',
            orphanedInstances: [],
            roles: [
              { 'name': 'role1', 'failing-checks': [], 'desiredCount': 1, 'healthyCount': 0, 'unhealthyCount': 0 },
              { 'name': 'role1-blue', 'failing-checks': [], 'desiredCount': 2, 'healthyCount': 0, 'unhealthyCount': 0 }
            ],
            service: 'svc1',
            slice: 'blue'
          }
        ]);
      });
    });
    context('when there is current state and desired state with no matches', function () {
      let desired = {
        'env1-svc1-blue': { environment: 'env1', roles: { role1: { desiredCount: 1 } }, service: 'svc1', slice: 'blue' }
      };
      let current = {
        'env1-svc1-blue': { roles: { 'role1-blue': { healthyCount: 2, unhealthyCount: 0 } } }
      };
      it('returns the health aggregated by server role', function () {
        return sut.compare(desired, current).should.eql([
          {
            name: 'env1-svc1-blue',
            environment: 'env1',
            orphanedInstances: [],
            roles: [
              { 'name': 'role1', 'failing-checks': [], 'desiredCount': 1, 'healthyCount': 0, 'unhealthyCount': 0 },
              { 'name': 'role1-blue', 'failing-checks': [], 'desiredCount': 0, 'healthyCount': 2, 'unhealthyCount': 0 }
            ],
            service: 'svc1',
            slice: 'blue'
          }
        ]);
      });
    });
    context('when the current state contains an instance without a role', function () {
      let desired = {
        'env1-svc1-blue': { environment: 'env1', roles: { role1: { desiredCount: 1 } }, service: 'svc1', slice: 'blue' }
      };
      let current = {
        'env1-svc1-blue': { instances: { 'node-not-in-role': { healthyCount: 1, unhealthyCount: 0 } } }
      };
      it('returns the instance health information', function () {
        return sut.compare(desired, current).should.eql([
          {
            name: 'env1-svc1-blue',
            environment: 'env1',
            orphanedInstances: [
              { 'name': 'node-not-in-role', 'failing-checks': [], 'healthyCount': 1, 'unhealthyCount': 0 }
            ],
            roles: [
              { 'name': 'role1', 'failing-checks': [], 'desiredCount': 1, 'healthyCount': 0, 'unhealthyCount': 0 }
            ],
            service: 'svc1',
            slice: 'blue'
          }
        ]);
      });
    });
  });
});
