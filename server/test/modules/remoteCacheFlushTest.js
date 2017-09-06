'use strict';

// eslint-disable-next-line no-unused-vars
const rewire = require('rewire');
const assert = require('assert');

describe.only('remoteCacheFlush', () => {
  let sut;

  beforeEach(() => {
    sut = rewire('modules/remoteCacheFlush');
    // eslint-disable-next-line no-underscore-dangle
    sut.__set__('consulClient', {
      create: () => {
        return Promise.resolve({
          catalog: {
            service: {
              list: () => {
                return Promise.resolve(MockData().Services);
              },
              nodes: (s) => {
                return Promise.resolve(MockData().Nodes.filter(x => x.ServiceName === s));
              }
            }
          }
        });
      }
    });
  });

  it('should exist', () => {
    assert(sut);
  });

  it('should respond to [flush()]', () => {
    assert(typeof sut.flush === 'function');
  });

  it('should return list of addresses', (done) => {
    sut.flush('c50', MockData().Hosts)
      .then((addresses) => {
        assert.deepEqual(addresses, [
          'https://1.1.1.1:1111/diagnostics/cachereset',
          'https://1.3.5.7:4444/diagnostics/cachereset'
        ]);
        done();
      });
  });
});

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
    ]
  };
}
