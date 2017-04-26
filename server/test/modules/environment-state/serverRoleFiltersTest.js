'use strict';

require('should');
let { createServerRoleFilter } = require('modules/environment-state/serverRoleFilters');

describe('createServerRoleFilter', function () {
  context('when filtering by service name only', function () {
    it('excludes a role that has just the service but where Action is not Install', function () {
      let sut = createServerRoleFilter({ serviceName: 'T' });
      sut({ Services: [{ Name: 'T', Action: '?' }] }).should.be.false();
    });
    it('includes a role that has just the service and where there is no Action', function () {
      let sut = createServerRoleFilter({ serviceName: 'T' });
      sut({ Services: [{ Name: 'T' }] }).should.be.true();
    });
    it('includes a role that has just the service and where Action is Install', function () {
      let sut = createServerRoleFilter({ serviceName: 'T' });
      sut({ Services: [{ Name: 'T', Action: 'Install' }] }).should.be.true();
    });
    it('includes a role that has the service among others', function () {
      let sut = createServerRoleFilter({ serviceName: 'T' });
      sut({
        Services: [
          { Name: 'S' },
          { Name: 'T' },
          { Name: 'U' }
        ]
      }).should.be.true();
    });
  });

  context('when filtering by service name and slice', function () {
    it('includes a role that has just the slice', function () {
      let sut = createServerRoleFilter({ serviceName: 'T', slice: 'blue' });
      sut({ Services: [{ Name: 'T', Slice: 'blue' }] }).should.be.true();
    });
    it('excludes a role that does not have the slice', function () {
      let sut = createServerRoleFilter({ serviceName: 'T', slice: 'blue' });
      sut({ Services: [{ Name: 'T', Slice: 'green' }] }).should.be.false();
    });
    it('includes a role that has the slice among others', function () {
      let sut = createServerRoleFilter({ serviceName: 'T', slice: 'blue' });
      sut({
        Services: [
          { Name: 'T', Slice: 'none' },
          { Name: 'T', Slice: 'blue' }
        ]
      }).should.be.true();
    });
  });

  context('when filtering by service name and role', function () {
    it('includes a role with the same name', function () {
      let sut = createServerRoleFilter({ serverRole: 'A', serviceName: 'T' });
      sut({ Role: 'A', Services: [{ Name: 'T' }] }).should.be.true();
    });
    it('excludes a role with a different name', function () {
      let sut = createServerRoleFilter({ serverRole: 'A', serviceName: 'T' });
      sut({ Role: 'A-blue1', Services: [{ Name: 'T' }] }).should.be.false();
    });

    let scenarios = [
      '-blue',
      '-green'
    ];
    scenarios.forEach((suffix) => {
      it(`includes a role with a suffix of ${suffix} regardless of the slice filter`, function () {
        let sut = createServerRoleFilter({ serverRole: 'A', serviceName: 'T', slice: 'blue' });
        sut({ Role: `A${suffix}`, Services: [{ Name: 'T', Slice: 'blue' }] }).should.be.true();
      });
    });
  });
});
