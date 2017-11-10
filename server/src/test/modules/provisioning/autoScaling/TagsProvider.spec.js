/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');

describe('TagsProvider:', () => {

  it('should be possible to get all required tags from the configuration', () => {

    // Arrange
    var namingConventionProviderMock = {
      getRoleName: sinon.stub().returns('expected-role-name'),
    };

    var configuration = {
      environmentTypeName: 'Prod',
      environmentName: 'pr1',
      serverRole: {
        SecurityZone: 'Secure',
        ServerRoleName: 'Web',
        ContactEmailTag: 'test@email.com',
        ScheduleTag: '247',
      },
      cluster: {
        Name: 'Tango',
        ShortName: 'ta'
      },
    };

    // Act
    var target = proxyquire('../../../../modules/provisioning/autoScaling/tagsProvider', {
      '../namingConventionProvider': namingConventionProviderMock,
    });
    var promise = target.get(configuration);

    // Assert
    return promise.then(tags => should(tags).eql({
      EnvironmentType: 'Prod',
      Environment: 'pr1',
      SecurityZone: 'Secure',
      OwningCluster: 'Tango',
      OwningClusterShortName: 'ta',
      OwningTeam: 'Tango',
      Role: 'expected-role-name',
      ContactEmail: 'test@email.com',
      Schedule: '247',
    }));

  });

  it("should be possible to get 'RoleTag' from namingConventionProvider service", () => {

    // Arrange
    var namingConventionProviderMock = {
      getRoleName: sinon.stub().returns('expected-role-name'),
    };

    var configuration = {
      environmentTypeName: 'Prod',
      environmentName: 'pr1',
      serverRole: {
        SecurityZone: 'Secure',
        ServerRoleName: 'Web',
        ContactEmailTag: 'test@email.com',
        ScheduleTag: '247',
      },
      cluster: {
        Name: 'Tango',
      },
    };

    var sliceName = 'blue';

    // Act
    var target = proxyquire('../../../../modules/provisioning/autoScaling/tagsProvider', {
      '../namingConventionProvider': namingConventionProviderMock,
    });
    target.get(configuration, sliceName);

    // Assert
    namingConventionProviderMock.getRoleName.called.should.be.true();
    namingConventionProviderMock.getRoleName.getCall(0).args.should.match(
      [configuration, sliceName]
    );

  });

  it('should be possible to get an empty schedule tag when it is missing', () => {

    // Arrange
    var namingConventionProviderMock = {
      getRoleName: sinon.stub(),
    };

    var configuration = {
      environmentTypeName: 'Prod',
      environmentName: 'pr1',
      serverRole: {
        SecurityZone: 'Secure',
        ServerRoleName: 'Web',
        ContactEmailTag: 'test@email.com',
        ScheduleTag: null,
      },
      cluster: {
        Name: 'Tango',
      },
    };

    // Act
    var target = proxyquire('../../../../modules/provisioning/autoScaling/tagsProvider', {
      '../namingConventionProvider': namingConventionProviderMock,
    });
    var promise = target.get(configuration);

    // Assert
    return promise.then(tags => tags.Schedule.should.be.equal(''));

  });

  it("an error should be raised when 'ContactEmailTag' property is missing in configuration", () => {

    // Arrange
    var namingConventionProviderMock = {
      getRoleName: sinon.stub(),
    };

    var configuration = {
      environmentTypeName: 'Prod',
      environmentName: 'pr1',
      serverRole: {
        SecurityZone: 'Secure',
        ServerRoleName: 'Web',
        ContactEmailTag: null,
        ScheduleTag: '247',
      },
      cluster: {
        Name: 'Tango',
      },
    };

    // Act
    var target = proxyquire('../../../../modules/provisioning/autoScaling/tagsProvider', {
      '../namingConventionProvider': namingConventionProviderMock,
    });
    var promise = target.get(configuration);

    // Assert
    return promise.then(
      () => should.ok(false, 'Promise should fail'),
      (error) => error.toString().should.be.containEql("Missing 'ContactEmail' tag in configuration.")
    );

  });

});

