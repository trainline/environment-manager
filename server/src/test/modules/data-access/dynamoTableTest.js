'use strict';

require('should');
let sinon = require('sinon');
const inject = require('inject-loader!../../../modules/data-access/dynamoTable');

let tableName = 'some-table';

function dynamoTable(dynamo, dynamoExpressionCompiler) {
  return inject({
    './describeDynamoTable': () => Promise.resolve({
      Table: {
        KeySchema: [
          { AttributeName: 'ID', KeyType: 'HASH' }
        ]
      }
    }),
    '../amazon-client/masterAccountClient': {
      createDynamoClient: () => Promise.resolve(dynamo)
    },
    '../awsDynamo/dynamodbExpression': {
      compile: dynamoExpressionCompiler
    }
  });
}

describe('dynamoTable', function () {
  describe('create', function () {
    it('calls put with the expected arguments', function () {
      let dynamo = {
        put: sinon.spy(() => ({
          promise: () => Promise.resolve()
        }))
      };
      let sut = dynamoTable(dynamo, x => x);
      let item = {
        record: {
          ID: 'a',
          value: 'A'
        },
        expressions: {
          ConditionExpression: ['=', ['at', 'ID'], ['val', 'a']]
        }
      };
      let expectedArgs = {
        TableName: 'some-table',
        Item: item.record,
        ConditionExpression: ['=', ['at', 'ID'], ['val', 'a']]
      };
      return sut.create(tableName, item).then(() => sinon.assert.calledWith(dynamo.put, sinon.match(expectedArgs)));
    });

    it('returns the expected error when the item already exists', function () {
      let error = (() => {
        let t = new Error();
        t.code = 'ConditionalCheckFailedException';
        return t;
      })();
      let dynamo = {
        put: sinon.spy(() => ({
          promise: () => Promise.reject(error)
        }))
      };
      let sut = dynamoTable(dynamo);
      return sut.create(tableName, { record: { ID: 'A' } }).should.be.rejectedWith(/Could not create this item because an item with the same key already exists. table = some-table key = {"ID":"A"}\./);
    });
  });

  describe('delete', function () {
    it('calls delete with the expected arguments', function () {
      let dynamo = {
        delete: sinon.spy(() => ({
          promise: () => Promise.resolve()
        }))
      };
      let sut = dynamoTable(dynamo, x => x);
      let arg = {
        key: { ID: 'A' },
        expressions: {
          ConditionExpression: ['=', ['at', 'ID'], ['val', 'a']]
        }
      };
      let expectedArgs = {
        TableName: 'some-table',
        Key: arg.key,
        ConditionExpression: ['=', ['at', 'ID'], ['val', 'a']]
      };
      return sut.delete(tableName, arg).then(() => sinon.assert.calledWith(dynamo.delete, sinon.match(expectedArgs)));
    });

    it('returns the expected error when the item has been modified', function () {
      let error = (() => {
        let t = new Error();
        t.code = 'ConditionalCheckFailedException';
        return t;
      })();
      let dynamo = {
        delete: sinon.spy(() => ({
          promise: () => Promise.reject(error)
        }))
      };
      let sut = dynamoTable(dynamo);
      return sut.delete(tableName, { key: { ID: 'A' } }).should.be.rejectedWith(/Could not delete this item because it has been modified. table = some-table key = {"ID":"A"}\./);
    });
  });

  describe('get', function () {
    it('calls get with the expected arguments', function () {
      let dynamo = {
        get: sinon.spy(() => ({
          promise: () => Promise.resolve({})
        }))
      };
      let sut = dynamoTable(dynamo);
      let key = { ID: 'A' };
      let expectedArgs = {
        TableName: 'some-table',
        Key: key
      };
      return sut.get(tableName, key).then(() => sinon.assert.calledWith(dynamo.get, sinon.match(expectedArgs)));
    });

    it('returns the item if it exists', function () {
      let expectedItem = {
        ID: 'A',
        value: 'a'
      };
      let dynamo = {
        get: sinon.spy(() => ({
          promise: () => Promise.resolve({ Item: expectedItem })
        }))
      };
      let sut = dynamoTable(dynamo);
      return sut.get(tableName, { ID: 'A' }).should.finally.eql(expectedItem);
    });

    it('returns null when the item does not exist', function () {
      let dynamo = {
        get: sinon.spy(() => ({
          promise: () => Promise.resolve({})
        }))
      };
      let sut = dynamoTable(dynamo);
      return sut.get(tableName, { ID: 'A' }).should.finally.be.null();
    });
  });

  describe('replace', function () {
    it('calls put with the expected arguments', function () {
      let dynamo = {
        put: sinon.spy(() => ({
          promise: () => Promise.resolve()
        }))
      };
      let sut = dynamoTable(dynamo, x => x);
      let item = {
        record: {
          ID: 'a',
          value: 'A'
        },
        expressions: {
          ConditionExpression: ['=', ['at', 'ID'], ['val', 'a']]
        }
      };
      let expectedArgs = {
        TableName: 'some-table',
        Item: item.record,
        ConditionExpression: ['=', ['at', 'ID'], ['val', 'a']]
      };
      return sut.replace(tableName, item).then(() => sinon.assert.calledWith(dynamo.put, sinon.match(expectedArgs)));
    });

    it('returns the expected error when the item has been modified', function () {
      let error = (() => {
        let t = new Error();
        t.code = 'ConditionalCheckFailedException';
        return t;
      })();
      let dynamo = {
        put: sinon.spy(() => ({
          promise: () => Promise.reject(error)
        }))
      };
      let sut = dynamoTable(dynamo);
      return sut.replace(tableName, { record: { ID: 'A' } }).should.be.rejectedWith(/Could not update this item because it has been modified. table = some-table key = {"ID":"A"}\./);
    });
  });

  describe('scan', function () {
    it('calls scan with the expected arguments', function () {
      let dynamo = {
        scan: sinon.spy(() => ({
          eachPage: (cb) => { cb(null, { Items: [] }); cb(null, null); }
        }))
      };
      let sut = dynamoTable(dynamo);
      let expectedArgs = {
        TableName: 'some-table'
      };
      return sut.scan(tableName).then(() => sinon.assert.calledWith(dynamo.scan, sinon.match(expectedArgs)));
    });

    it('returns the items', function () {
      let expectedItems = [
        { ID: 'A', value: 'a' },
        { ID: 'B', value: 'b' }
      ];
      let dynamo = {
        scan: sinon.spy(() => ({
          eachPage: (cb) => {
            cb(null, { Items: [expectedItems[0]] });
            cb(null, { Items: [expectedItems[1]] });
            cb(null, null);
          }
        }))
      };
      let sut = dynamoTable(dynamo);
      return sut.scan(tableName).should.finally.eql(expectedItems);
    });
  });
});
