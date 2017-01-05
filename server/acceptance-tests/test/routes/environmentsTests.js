/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var should  = require('should'),
    helper  = require('../utils/testHelper'),
    GIVEN   = require('../utils/given'),
    WHEN    = require('../utils/when'),
    THE     = require('../utils/the');

xdescribe(`Describing [config/environments] API`, () => {

  before(`Starting the server`, helper.startServer);

  describe(`Creating a new environment`, () => {

    GIVEN.environmentsInDynamoDB([]);

    GIVEN.infraOpsEnvironmentDynamoDBTable([]);

    var environment = { Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: true } };

    WHEN.iPost("/api/config/environments/sb9", environment, (response) => {

      it('it should return [OK] HTTP status code', () => {
        should(response.status).equal(200);
      });

      THE.dynamoDBTable('ConfigEnvironments')((result) => {

        it('Configuration item for "sb9" environment should be created', () => {
          result.items.should.matchAny({ EnvironmentName: 'sb9' });
        });

        it('"sb9" environment should have a proper auditing', () => {
          result.items.should.matchAny({
            EnvironmentName: 'sb9',
            Audit: {
              Version: 0,
              User: 'test'
            } });
        });

      });

      THE.dynamoDBTable('InfraOpsEnvironment')((result) => {

        it('Operation item for "sb9" environment should be created', () => {
          result.items.should.matchAny({ EnvironmentName: 'sb9' });
        });

        it('"sb9" environment should have a proper auditing', () => {
          result.items.should.matchAny({
            EnvironmentName: 'sb9',
            Audit: {
              Version: 0,
              User: 'test'
            } });
        });

      });

    });

  });

  describe(`Updating configuration for an existing environment`, () => {

    var originalAudit = {
      Version: 99,
      TransactionID: 'xxxxx',
      User: 'old-user',
      LastChanged: 'asd'
    };

    GIVEN.environmentsInDynamoDB([
      {
        EnvironmentName: 'sb9',
        Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'Original' },
        Audit: originalAudit
      }
    ]);

    GIVEN.infraOpsEnvironmentDynamoDBTable([
      {
        EnvironmentName: 'sb9',
        Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'Original' },
        Audit: originalAudit
      }
    ]);

    var environment = { Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'Changed' } };

    WHEN.iPut("/api/config/environments/sb9", environment, (response) => {

      it('it should return [OK] HTTP status code', () => {
        should(response.status).equal(200);
      });

      THE.dynamoDBTable('ConfigEnvironments')((result) => {

        it('Configuration for "sb9" environment should be changed', () => {

          var environmentSB9 = result.items.filter((item) => {
            return item.EnvironmentName === 'sb9'
          });

          environmentSB9.length.should.equal(1);
          environmentSB9[0].Value.Test.should.equal('Changed');
          environmentSB9[0].Audit.Version.should.equal(originalAudit.Version + 1);

          environmentSB9[0].Audit.should.not.match({
            User: originalAudit.User,
            TransactionID: originalAudit.TransactionID,
            LastChanged: originalAudit.LastChanged
          });

        });

      });

      THE.dynamoDBTable('InfraOpsEnvironment')((result) => {

        it('Operation info for "sb9" environment should not be changed', () => {

          var environmentSB9 = result.items.filter((item) => {
            return item.EnvironmentName === 'sb9'
          });

          environmentSB9.length.should.equal(1);
          environmentSB9[0].Value.Test.should.equal('Original');
          environmentSB9[0].Audit.should.match(originalAudit);
        });

      });

    });

  });

  describe(`Updating operational info for an existing environment`, () => {

    GIVEN.environmentsInDynamoDB([
      {
        EnvironmentName: 'sb9',
        Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'Original' }
      }
    ]);

    GIVEN.infraOpsEnvironmentDynamoDBTable([
      {
        EnvironmentName: 'sb9',
        Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'Original' }
      }
    ]);

    var environment = { Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'Changed' } };

    WHEN.iPut("/api/ops/environments/sb9", environment, (response) => {

      it('it should return [OK] HTTP status code', () => {
        should(response.status).equal(200);
      });

      THE.dynamoDBTable('ConfigEnvironments')((result) => {

        it('Configuration for "sb9" environment should not be changed', () => {
          result.items.should.not.matchAny({ Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'Changed' } });
        });

      });

      THE.dynamoDBTable('InfraOpsEnvironment')((result) => {

        it('Operation info for "sb9" environment should be changed', () => {
          result.items.should.matchAny({ EnvironmentName: 'sb9', Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'Changed' } });
        });

      });

    });

  });

  describe(`Deleting an existing environment`, () => {

    GIVEN.environmentsInDynamoDB([
      {
        EnvironmentName: 'sb9',
        Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: true }
      }
    ]);

    GIVEN.infraOpsEnvironmentDynamoDBTable([
      {
        EnvironmentName: 'sb9',
        Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: true }
      }
    ]);

    WHEN.iDelete("/api/config/environments/sb9", (response) => {

      it('it should return [OK] HTTP status code', () => {
        should(response.status).equal(200);
      });

      THE.dynamoDBTable('ConfigEnvironments')((result) => {

        it('Environment "sb9" should not exist anymore', () => {
          result.items.should.not.matchAny({ EnvironmentName: 'sb9' });
        });

      });

      THE.dynamoDBTable('InfraOpsEnvironment')((result) => {

        it('Environment "sb9" should not exist anymore', () => {
          result.items.should.not.matchAny({ EnvironmentName: 'sb9' });
        });

      });

    });

  });
  
  describe(`Merging a new environment to the existing ones`, () => {

    GIVEN.environmentsInDynamoDB([
      { EnvironmentName: 'sb1', Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'sb1-configuration' } },
      { EnvironmentName: 'sb2', Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'sb2-configuration' } }
    ]);

    GIVEN.infraOpsEnvironmentDynamoDBTable([
      { EnvironmentName: 'sb1', Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'sb1-configuration' } },
      { EnvironmentName: 'sb2', Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'sb2-configuration' } }
    ]);

    var environments = [
      { EnvironmentName: 'sb1', Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'sb1-configuration-changed' } },
      { EnvironmentName: 'sb9', Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'sb9-configuration' } }
    ];

    WHEN.iPut("/api/merge/config/environments", environments, (response) => {

      THE.dynamoDBTable('ConfigEnvironments')((result) => {

        it('Configuration data for environment "sb1" should be changed', () => {
            result.items.should.matchAny({ EnvironmentName: 'sb1', Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'sb1-configuration-changed' } });
        });

        it('Configuration data for environment "sb2" should NOT be changed', () => {
          result.items.should.matchAny({ EnvironmentName: 'sb2', Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'sb2-configuration' } });
        });

        it('Configuration data for environment "sb9" should be added', () => {
          result.items.should.matchAny({ EnvironmentName: 'sb9', Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'sb9-configuration' } });
        });

      });

      THE.dynamoDBTable('InfraOpsEnvironment')((result) => {

        it('Operation data for environment "sb1" should NOT be changed', () => {
          result.items.should.matchAny({ EnvironmentName: 'sb1', Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'sb1-configuration' } });
        });

        it('Operation data for environment "sb2" should NOT be changed', () => {
          result.items.should.matchAny({ EnvironmentName: 'sb2', Value: { OwningCluster: 'test', EnvironmentType: 'test', Test: 'sb2-configuration' } });
        });

        it('Operation data for environment "sb9" should be added', () => {
          result.items.should.matchAny({ EnvironmentName: 'sb9' });
        });

      });

    });

  });

  describe(`Replacing current environment with an existing one and a new one`, () => {

    GIVEN.environmentsInDynamoDB([
      { EnvironmentName: 'sb1', Value: 'sb1-configuration' },
      { EnvironmentName: 'sb2', Value: 'sb2-configuration' }
    ]);

    GIVEN.infraOpsEnvironmentDynamoDBTable([
      { EnvironmentName: 'sb1', Value: 'sb1-operation' },
      { EnvironmentName: 'sb2', Value: 'sb2-operation' }
    ]);

    var environments = [
      { EnvironmentName: 'sb1', Value: 'sb1-configuration-changed' },
      { EnvironmentName: 'sb9', Value: 'sb9-configuration' }
    ];

    WHEN.iPut("/api/replace/config/environments", environments, (response) => {

      THE.dynamoDBTable('ConfigEnvironments')((result) => {

        it('Configuration data for environment "sb1" should be changed', () => {
          result.items.should.matchAny({ EnvironmentName: 'sb1', Value: 'sb1-configuration-changed' });
        });

        it('Configuration data for environment "sb2" should be removed', () => {
          result.items.should.not.matchAny({ EnvironmentName: 'sb2' });
        });

        it('Configuration data for environment "sb9" should be added', () => {
          result.items.should.matchAny({ EnvironmentName: 'sb9', Value: 'sb9-configuration' });
        });

      });

      THE.dynamoDBTable('InfraOpsEnvironment')((result) => {

        it('Operation data for environment "sb1" should NOT be changed', () => {
          result.items.should.matchAny({ EnvironmentName: 'sb1', Value: 'sb1-operation' });
        });

        it('Operation data for environment "sb2" should be removed', () => {
          result.items.should.not.matchAny({ EnvironmentName: 'sb2' });
        });

        it('Operation data for environment "sb9" should be added', () => {
          result.items.should.matchAny({ EnvironmentName: 'sb9' });
        });

      });

    });

  });
  
  after('Stopping the server', helper.stopServer);

});
