/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let Target = require('modules/userRolesProvider');

describe('UserRolesProvider:', () => {

  describe('an user who belongs to [GG-APP-EnvironmentManager-ReadOnly] membership group', () => {
    it('should be able to "view" only', () => {
      // Act
      var target = new Target();
      var result = target.getFromActiveDirectoryGroupMembership('GG-APP-EnvironmentManager-ReadOnly');

      // Assert
      result.should.matchAny('view');
      result.length.should.be.equal(1);

    });
  });

  describe('an user who belongs to [GG-APP-EnvironmentManager-Toggle] membership group', () => {
    it('should be able to "view" and "toggle"', () => {

      // Act
      var target = new Target();
      var result = target.getFromActiveDirectoryGroupMembership('GG-APP-EnvironmentManager-Toggle');

      // Assert
      result.should.matchAny('view');
      result.should.matchAny('toggle');
      result.length.should.be.equal(2);

    });
  });

  describe('an user who belongs to [GG-APP-EnvironmentManager-Editor] membership group', () => {
    it('should be able to "view", "toggle" and "edit"', () => {

      // Act
      var target = new Target();
      var result = target.getFromActiveDirectoryGroupMembership('GG-APP-EnvironmentManager-Editor');

      // Assert
      result.should.matchAny('view');
      result.should.matchAny('edit');
      result.should.matchAny('toggle');
      result.length.should.be.equal(3);

    });
  });

});
