'use strict';

const should = require('should');
const sut = require('../../modules/resourceProvider');

describe('resourceProvider', function () {
  function syncErrorWithStackMatching(regex) {
    return fun => should(fun).throw({ stack: regex });
  }
  const scenarios = [
    ['asgs', syncErrorWithStackMatching(/asgResourceFactory/)],
    ['asgs-scheduled-actions', syncErrorWithStackMatching(/asgScheduledActionsResourceFactory/)],
    ['images', syncErrorWithStackMatching(/ec2ImageResourceFactory/)],
    ['instanceprofiles', syncErrorWithStackMatching(/iamInstanceProfileResourceFactory/)],
    ['instances', syncErrorWithStackMatching(/ec2InstanceResourceFactory/)],
    ['launchconfig', syncErrorWithStackMatching(/launchConfigurationResourceFactory/)],
    ['nginx', fun => fun().should.finally.match({ all: () => {} })],
    ['sg', syncErrorWithStackMatching(/securityGroupResourceFactory/)]
  ];

  scenarios.forEach(([resourceName, assertion = () => { throw new Error('Missing assertion'); }]) => {
    it(`it returns the expected resource factory when passed '${resourceName}'`, function () {
      return assertion(() => sut.getInstanceByName(resourceName));
    });
  });
});
