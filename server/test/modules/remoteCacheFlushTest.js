'use strict';

// eslint-disable-next-line no-unused-vars
const rewire = require('rewire');
const assert = require('assert');
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
  });

  it('should make a post request for each address found', (done) => {
    sut.flush('c50', MockData().Hosts)
      .then((addresses) => {
        MockData().Expectations.Addresses.forEach((address) => {
          assert(MockRequest.post.calledWith(address));
        });
        done();
      })
      .catch((e) => {
        done(e);
      });
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
      ]
    ],
    Services: {
      'c50-serviceSuper-green': [],
      'c50-serviceDeLaCheese-blue': []
    },
    Nodes: [
      {
        ServiceName: 'c50-serviceSuper-green',
        Address: '1.1.1.1'
      },
      {
        ServiceName: 'c50-serviceDeLaCheese-blue',
        Address: '1.3.5.7'
      }
    ],
    Expectations: {
      Addresses: [
        'https://1.1.1.1:1111/diagnostics/cachereset',
        'https://1.3.5.7:4444/diagnostics/cachereset'
      ]
    }
  };
}
