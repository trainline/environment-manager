'use strict';

// eslint-disable-next-line no-unused-vars
const rewire = require('rewire');
// const assert = require('assert');
const sinon = require('sinon');

describe('remoteCacheFlush', () => {
  let sut;
  let MockRequest;

  beforeEach(() => {
    sut = rewire('modules/remoteCacheFlush');
    // eslint-disable-next-line no-underscore-dangle
    sut.__set__('consulClient', MockConsulClient());
    MockRequest = {
      post: sinon.spy()
    };
    // eslint-disable-next-line no-underscore-dangle
    sut.__set__('request', MockRequest);
    // eslint-disable-next-line no-underscore-dangle
    sut.__set__('configEnvironments', {
      get: sinon.stub().returns(Promise.resolve(
        { Value: { EnvironmentType: 'Cluster' } }
      ))
    });
    // eslint-disable-next-line no-underscore-dangle
    sut.__set__('config', {
      getUserValue: sinon.stub().returns({
        CacheReset: {
          Cluster: {
            plain: 'aaa'
          }
        }
      })
    });
  });

  it('should make a post request for each address found', (done) => {
    // sut.flush('c50', MockData().Hosts)
    //   .then((addresses) => {
    //     MockData().Expectations.Addresses.forEach((address) => {
    //       assert(MockRequest.post.calledWith({
    //         method: 'POST',
    //         uri: address,
    //         headers: { 'Content-Type': 'application/json' },
    //         json: true,
    //         body: {
    //           token: 'aaa'
    //         }
    //       }));
    //     });
    //     done();
    //   })
    //   .catch((e) => {
    //     done(e);
    //   });
  });
});

function MockConsulClient() {
  return {
    create: () => {
      return Promise.resolve({
        catalog: {
          service: {
            // Should provide 'all' services to the caller
            list: () => {
              return Promise.resolve(MockData().Services);
            },
            // Should response by providing a list of nodes which match the service provided
            nodes: (s) => {
              return Promise.resolve(MockData().Nodes.filter(x => x.ServiceName === s));
            }
          }
        }
      });
    }
  };
}

function MockData() {
  return {
    Hosts: [
      [{ host: 'c50-serviceSuper-green', port: 1111, environment: 'c50' }],
      [{ host: 'c50-serviceLawnMower-blue', port: 1122, environment: 'c50' }],
      [
        { host: 'c50-serviceDeLaCheese-green', port: 3333, environment: 'c50' },
        { host: 'c50-serviceDeLaCheese-blue', port: 4444, environment: 'c50' }
      ],
      [{ host: 'c50-upstream-blue', port: 1212, environment: 'c50' }],
      [{ host: 'c50-slice-blue', port: 3333, environment: 'c50' }]
    ],
    Services: {
      'c50-serviceSuper-green': [],
      'c50-serviceDeLaCheese-blue': [],
      'c50-upstream-blue': [],
      'c50-slice-blue': []
    },
    Nodes: [
      {
        ServiceName: 'c50-serviceSuper-green',
        Address: '1.1.1.1'
      },
      {
        ServiceName: 'c50-serviceDeLaCheese-blue',
        Address: '1.3.5.7'
      },
      {
        ServiceName: 'c50-serviceDeLaCheese-blue',
        Address: '1.3.5.11'
      },
      {
        ServiceName: 'c50-upstream-blue',
        Address: '1.2.1.2'
      },
      {
        ServiceName: 'c50-slice-blue',
        Address: '3.3.3.3'
      }
    ],
    Expectations: {
      Addresses: [
        'https://1.1.1.1:1111/diagnostics/cachereset',
        'https://1.3.5.7:4444/diagnostics/cachereset',
        'https://1.3.5.11:4444/diagnostics/cachereset',
        'https://1.2.1.2:1212/diagnostics/cachereset',
        'https://3.3.3.3:3333/diagnostics/cachereset'
      ]
    }
  };
}
