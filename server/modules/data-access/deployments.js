/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { getTableName: physicalTableName } = require('modules/awsResourceNameProvider');
let Promise = require('bluebird');
let awsAccounts = require('modules/awsAccounts');
let logger = require('modules/logger');
let { mkArn } = require('modules/data-access/dynamoTableArn');
let describeDynamoTable = require('modules/data-access/describeDynamoTable');
let { hashKeyAttributeName, tableArn } = require('modules/data-access/dynamoTableDescription');
let { DateTimeFormatterBuilder, LocalDate, ZoneId } = require('js-joda');
let { makeWritable } = require('modules/data-access/dynamoItemFilter');
let dynamoTable = require('modules/data-access/dynamoTable');
let fp = require('lodash/fp');

const DEFAULT_SCAN_EXPRESSIONS = {
  ProjectionExpression: ['list', ', ',
    ['at', 'AccountName'],
    ['at', 'DeploymentID'],
    ['at', 'Value', 'EndTimestamp'],
    ['at', 'Value', 'EnvironmentName'],
    ['at', 'Value', 'EnvironmentType'],
    ['at', 'Value', 'Nodes'],
    ['at', 'Value', 'OwningCluster'],
    ['at', 'Value', 'RuntimeServerRoleName'],
    ['at', 'Value', 'ServerRoleName'],
    ['at', 'Value', 'ServiceName'],
    ['at', 'Value', 'ServiceSlice'],
    ['at', 'Value', 'ServiceVersion'],
    ['at', 'Value', 'StartTimestamp'],
    ['at', 'Value', 'Status'],
    ['at', 'Value', 'User']]
};

const ES_DATETIME_FORMAT = new DateTimeFormatterBuilder().appendInstant(3).toFormatter();

function otherAccounts() {
  return awsAccounts.all()
    .then(fp.flow(
      fp.filter(x => !x.IsMaster),
      fp.map('AccountNumber'),
      fp.uniq));
}

function factory({ archivedDeploymentsTable, archivedDeploymentsIndex, runningDeploymentsTable }) {
  let tableDescriptionPromise = args => mkArn(args).then(describeDynamoTable);

  let tableNames = [archivedDeploymentsTable, runningDeploymentsTable];

  function myTables() {
    return Promise.resolve(tableNames.map(tableName => mkArn({ tableName })));
  }

  function otherTables() {
    return otherAccounts()
      .then(fp.reduce((result, account) =>
        [...result, ...tableNames.map(tableName => mkArn({ account, tableName }))], []));
  }

  function create(item) {
    return tableDescriptionPromise({ tableName: runningDeploymentsTable }).then(description =>
      fp.flow(
        makeWritable,
        record => ({
          record,
          expressions: {
            ConditionExpression: ['attribute_not_exists', ['at', hashKeyAttributeName(description)]]
          }
        }),
        dynamoTable.create.bind(null, tableArn(description))
      )(item)
    );
  }

  function get(key) {
    let firstFoundOrNull = fp.flow(fp.find(x => x !== null), fp.defaultTo(null));
    let logAndReturnNull = (error) => { logger.warn(error); return null; };

    let getFromMyTables = () => Promise.map(myTables(), arn => dynamoTable.get(arn, key))
      .then(firstFoundOrNull);
    let getFromOtherTables = () => Promise.map(otherTables(), arn => dynamoTable.get(arn, key).catch(logAndReturnNull))
      .then(firstFoundOrNull);

    return getFromMyTables()
      .then(result => (result !== null ? Promise.resolve(result) : getFromOtherTables()));
  }

  function scanRunning(expressions) {
    return mkArn({ tableName: runningDeploymentsTable })
      .then(table => dynamoTable.scan(table, Object.assign({}, DEFAULT_SCAN_EXPRESSIONS, expressions)));
  }

  function queryByDateRange(minInstant, maxInstant, expressions) {
    function scanArchived() {
      function next(prevKey) {
        return prevKey.minusDays(1);
      }

      let createQuery = date => ({
        IndexName: archivedDeploymentsIndex,
        KeyConditionExpression: ['and',
          ['=', ['at', 'StartDate'], ['val', date.toString()]],
          ['>=', ['at', 'StartTimestamp'], ['val', ES_DATETIME_FORMAT.format(minInstant)]]],
        Limit: 100,
        ScanIndexForward: false
      });

      function loop(table, partition, lowerBound, results) {
        let partitionContainingLowerBound = LocalDate.ofInstant(lowerBound, ZoneId.UTC);
        if (partition.isBefore(partitionContainingLowerBound)) {
          return results;
        } else {
          return dynamoTable.query(table, Object.assign({}, DEFAULT_SCAN_EXPRESSIONS, expressions, createQuery(partition)))
            .then((result) => {
              results.push(...result);
              return loop(table, next(partition), lowerBound, results);
            });
        }
      }

      let tables = Promise.join(
        mkArn({ tableName: archivedDeploymentsTable }),
        Promise.map(otherAccounts(), account => mkArn({ account, tableName: archivedDeploymentsTable })),
        (mine, others) => [mine, ...others]
      );

      let firstPartition = LocalDate.ofInstant(maxInstant, ZoneId.UTC);
      return Promise.map(tables, table => Promise.resolve().then(() => loop(table, firstPartition, minInstant, [])).catch((error) => {
        logger.warn(error);
        return [];
      })).then(fp.flatten);
    }

    return Promise.join(
      scanRunning(expressions),
      scanArchived(),
      (running, archived) => [...running, ...archived]);
  }

  function update(expression) {
    return tableDescriptionPromise({ tableName: runningDeploymentsTable }).then(description =>
      fp.flow(
        ({ key, updateExpression }) => ({
          key,
          expressions: { UpdateExpression: updateExpression }
        }),
        dynamoTable.update.bind(null, tableArn(description))
      )(expression)
    );
  }

  function appendLogEntries({ key, logEntries }) {
    let updateExpression = [
      'update',
      ['set',
        ['at', 'Value', 'ExecutionLog'],
        ['list_append',
          ['at', 'Value', 'ExecutionLog'],
          ['val', logEntries]]]
    ];

    return update({
      key,
      updateExpression
    });
  }

  return {
    appendLogEntries,
    create,
    get,
    queryByDateRange,
    scanRunning,
    update
  };
}

module.exports = factory({
  archivedDeploymentsTable: physicalTableName('ConfigCompletedDeployments'),
  archivedDeploymentsIndex: 'StartDate-StartTimestamp-index',
  runningDeploymentsTable: physicalTableName('ConfigDeploymentExecutionStatus')
});
