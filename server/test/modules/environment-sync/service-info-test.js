'use strict';

let { getActiveCatalogService } = require('modules/environment-sync/service-info');
require('should');

let show = JSON.stringify.bind(JSON);

describe('modules/environment-sync/service-info', function () {
  describe('getActiveCatalogService', function () {
    let scenarios = [
      [{ Key: 'my-upstream', Hosts: [] }, ['Expected one active slice but found 0: upstream=my-upstream', null]],
      [{ Key: 'my-upstream', Hosts: [{ DnsName: 'a', State: 'up' }, { DnsName: 'b', State: 'up' }] }, ['Expected one active slice but found 2: upstream=my-upstream', null]],
      [{ Key: 'my-upstream', Hosts: [{ DnsName: 'a', State: 'up' }] }, [null, 'a']],
      [{ Key: 'my-upstream', Hosts: [{ DnsName: 'a', State: 'up' }, { DnsName: 'b', State: 'down' }] }, [null, 'a']],
      [{ Key: 'my-upstream', Hosts: [{ DnsName: 'a', State: 'up' }, { DnsName: 'a', State: 'up' }] }, [null, 'a']]
    ];
    scenarios.forEach(([arg, expected]) => {
      it(`${show(arg)} -> ${expected}`, function () {
        getActiveCatalogService(arg).should.eql(expected);
      });
    });
  });
});
