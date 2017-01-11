/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let RequestBuilder = require('modules/awsDynamo/awsDynamoRequestBuilder');

describe('Testing [awsDynamoRequestBuilder]:', function () {

  describe('when I want to build a request for scanning a table', function () {

    describe('and I want to obtain all items', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey' };
      var builder = new RequestBuilder(targetTable);
      var request = builder.scan().buildRequest();

      it('then it should be targeted to the right table', function (done) {
        should(request.TableName).be.equal('MyTable');
        done();
      });

      it('then it should not be filtered', function (done) {
        should.not.exist(request.ExpressionAttributeNames);
        should.not.exist(request.ExpressionAttributeValues);
        should.not.exist(request.ConditionExpression);
        should.not.exist(request.FilterExpression);
        should.not.exist(request.UpdateExpression);

        done();
      });

    });

    describe('and I want to obtain all items filtering by field', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey' };
      var builder = new RequestBuilder(targetTable);
      var filter = { MyField: 'my-field-value' };
      var request = builder.scan().filterBy(filter).buildRequest();

      it('then it should be filtered', function (done) {

        should.exist(request.ExpressionAttributeNames['#MyField']);
        should(request.ExpressionAttributeNames['#MyField']).be.equal('MyField');

        should.exist(request.ExpressionAttributeValues[':p0']);
        should(request.ExpressionAttributeValues[':p0']).be.equal('my-field-value');

        should.exist(request.FilterExpression);
        should(request.FilterExpression).be.equal('#MyField = :p0');

        done();
      });

    });

    describe('and I want to obtain all items filtering by multiple fields', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey' };
      var builder = new RequestBuilder(targetTable);
      var filter = { MyFieldOne: 'my-field-one', MyFieldTwo: 'my-field-two' };
      var request = builder.scan().filterBy(filter).buildRequest();

      it('then it should be filtered', function (done) {

        request.ExpressionAttributeNames.should.have.property('#MyFieldOne');
        request.ExpressionAttributeNames.should.have.property('#MyFieldTwo');
        request.ExpressionAttributeNames['#MyFieldOne'].should.equal('MyFieldOne');
        request.ExpressionAttributeNames['#MyFieldTwo'].should.equal('MyFieldTwo');

        request.ExpressionAttributeValues.should.have.property(':p0');
        request.ExpressionAttributeValues.should.have.property(':p1');
        request.ExpressionAttributeValues[':p0'].should.equal('my-field-one');
        request.ExpressionAttributeValues[':p1'].should.equal('my-field-two');

        should.exist(request.FilterExpression);
        should(request.FilterExpression).be.equal('#MyFieldOne = :p0 AND #MyFieldTwo = :p1');

        done();
      });

    });

    describe('and I want to obtain all items filtering by a nested field', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey' };
      var builder = new RequestBuilder(targetTable);
      var filter = { 'MyField.SubField': 'my-sub-field' };
      var request = builder.scan().filterBy(filter).buildRequest();

      it('then it should be filtered', function (done) {

        request.ExpressionAttributeNames.should.have.property('#MyField');
        request.ExpressionAttributeNames.should.have.property('#SubField');
        request.ExpressionAttributeNames['#MyField'].should.equal('MyField');
        request.ExpressionAttributeNames['#SubField'].should.equal('SubField');

        request.ExpressionAttributeValues.should.have.property(':p0');
        request.ExpressionAttributeValues[':p0'].should.equal('my-sub-field');

        should.exist(request.FilterExpression);
        should(request.FilterExpression).be.equal('#MyField.#SubField = :p0');

        done();
      });

    });

    describe('and I want to obtain all items filtering by a typed field', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey' };
      var builder = new RequestBuilder(targetTable);

      it('then it should be filtered by a string value', function (done) {

        var filter = { DoubleQuotedField: '"string"', QuotedField: '\'string\'' };
        var request = builder.scan().filterBy(filter).buildRequest();

        request.ExpressionAttributeValues[':p0'].should.equal('string');
        request.ExpressionAttributeValues[':p1'].should.equal('string');

        done();
      });

      it('then it should be filtered by a boolean value', function (done) {

        var filter = { BooleanField: 'true' };
        var request = builder.scan().filterBy(filter).buildRequest();

        request.ExpressionAttributeValues[':p0'].should.equal(true);
        done();
      });

      it('then it should be filtered by a numeric value', function (done) {

        var filter = { NumberField: '5' };
        var request = builder.scan().filterBy(filter).buildRequest();

        request.ExpressionAttributeValues[':p0'].should.equal(5);
        done();
      });

      it('then it should be filtered by a string value by default', function (done) {

        var filter = { DefaultField: 'without quotes' };
        var request = builder.scan().filterBy(filter).buildRequest();

        request.ExpressionAttributeValues[':p0'].should.equal('without quotes');
        done();
      });

    });

    describe('and I want to obtain all items filtering by starting date in UNIX format', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey', dateField: { name: 'DateField', format: 'UNIX' } };
      var builder = new RequestBuilder(targetTable);

      describe('and I specify "dateFrom" only in my filter', function () {

        var dateFrom = '2016-01-22T00:00:00.000Z';

        var filter = {
          $date_from: dateFrom,
        };

        var request = builder.scan().filterBy(filter).buildRequest();

        it('then should work', function () {

          should.exist(request.ExpressionAttributeNames['#DateField']);
          should(request.ExpressionAttributeNames['#DateField']).be.equal('DateField');

          should.exist(request.ExpressionAttributeValues[':p0']);
          should(request.ExpressionAttributeValues[':p0']).be.equal(new Date(dateFrom).getTime());

          should.exist(request.FilterExpression);
          should(request.FilterExpression).be.equal('#DateField >= :p0');
        });

      });

    });

    describe('and I want to obtain all items filtering by starting date in ISO format', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey', dateField: { name: 'DateField', format: 'ISO' } };
      var builder = new RequestBuilder(targetTable);

      describe('and I specify "dateFrom" only in my filter', function () {

        var dateFrom = '2016-01-22T00:00:00.000Z';

        var filter = {
          $date_from: dateFrom,
        };

        var request = builder.scan().filterBy(filter).buildRequest();

        it('then should work', function () {

          should.exist(request.ExpressionAttributeNames['#DateField']);
          should(request.ExpressionAttributeNames['#DateField']).be.equal('DateField');

          should.exist(request.ExpressionAttributeValues[':p0']);
          should(request.ExpressionAttributeValues[':p0']).be.equal(new Date(dateFrom).toISOString());

          should.exist(request.FilterExpression);
          should(request.FilterExpression).be.equal('#DateField >= :p0');
        });

      });

    });

    describe('and I want to obtain all items filtering by a date range in UNIX format', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey', dateField: { name: 'DateField', format: 'UNIX' } };
      var builder = new RequestBuilder(targetTable);

      describe('and I specify "dateFrom" and "dateTo" in my filter', function () {

        var dateFrom = '2016-01-22T00:00:00.000Z';
        var dateTo = '2016-01-22T23:59:59.999Z';

        var filter = {
          $date_from: dateFrom,
          $date_to: dateTo,
        };

        var request = builder.scan().filterBy(filter).buildRequest();

        it('then should work', function () {

          should.exist(request.ExpressionAttributeNames['#DateField']);
          should(request.ExpressionAttributeNames['#DateField']).be.equal('DateField');

          should.exist(request.ExpressionAttributeValues[':p0']);
          should(request.ExpressionAttributeValues[':p0']).be.equal(new Date(dateFrom).getTime());

          should.exist(request.ExpressionAttributeValues[':p1']);
          should(request.ExpressionAttributeValues[':p1']).be.equal(new Date(dateTo).getTime());

          should.exist(request.FilterExpression);
          should(request.FilterExpression).be.equal('#DateField >= :p0 AND #DateField <= :p1');
        });

      });

    });

    describe('and I want to obtain all items filtering by a date range in ISO format', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey', dateField: { name: 'DateField', format: 'ISO' } };
      var builder = new RequestBuilder(targetTable);

      describe('and I specify "dateFrom" and "dateTo" in my filter', function () {

        var dateFrom = '2016-01-22T00:00:00.000Z';
        var dateTo = '2016-01-22T23:59:59.999Z';

        var filter = {
          $date_from: dateFrom,
          $date_to: dateTo,
        };

        var request = builder.scan().filterBy(filter).buildRequest();

        it('then should work', function () {

          should.exist(request.ExpressionAttributeNames['#DateField']);
          should(request.ExpressionAttributeNames['#DateField']).be.equal('DateField');

          should.exist(request.ExpressionAttributeValues[':p0']);
          should(request.ExpressionAttributeValues[':p0']).be.equal(new Date(dateFrom).toISOString());

          should.exist(request.ExpressionAttributeValues[':p1']);
          should(request.ExpressionAttributeValues[':p1']).be.equal(new Date(dateTo).toISOString());

          should.exist(request.FilterExpression);
          should(request.FilterExpression).be.equal('#DateField >= :p0 AND #DateField <= :p1');
        });

      });

    });

  });

  describe('and I want to build a request for inserting a new item', function () {

    describe('and the target table has a key', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey' };
      var builder = new RequestBuilder(targetTable);
      var item = { MyKey: 'my-key-value', Value: 1 };
      var request = builder.insert().item(item).buildRequest();

      it('then it should be targeted to the right table', function (done) {
        should(request.TableName).be.not.Null();
        request.TableName.should.equal('MyTable');
        done();
      });

      it('then it should contain the expected item', function (done) {
        should(request.Item).be.not.Null();
        request.Item.should.equal(item);
        done();
      });

      it('then it should ensure the item does not already exist', function (done) {
        should(request.ExpressionAttributeNames).be.an.Object();
        should(request.ExpressionAttributeValues).be.an.Object();
        should(request.ConditionExpression).be.a.String();

        request.ExpressionAttributeNames.should.have.property('#MyKey');
        request.ExpressionAttributeNames['#MyKey'].should.equal('MyKey');

        request.ExpressionAttributeValues.should.have.property(':p0');
        request.ExpressionAttributeValues[':p0'].should.equal('my-key-value');

        request.ConditionExpression.should.equal('#MyKey <> :p0');
        done();
      });

    });

    describe('and the target table has key and range', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey', range: 'MyRange' };
      var builder = new RequestBuilder(targetTable);
      var item = { MyKey: 'my-key-value', MyRange: 'my-range-value', Value: 1 };
      var request = builder.insert().item(item).buildRequest();

      it('then it should ensure the item does not already exist', function (done) {
        should(request.ExpressionAttributeNames).be.an.Object();
        should(request.ExpressionAttributeValues).be.an.Object();
        should(request.ConditionExpression).be.a.String();

        request.ExpressionAttributeNames.should.have.property('#MyKey');
        request.ExpressionAttributeNames.should.have.property('#MyRange');
        request.ExpressionAttributeNames['#MyKey'].should.equal('MyKey');
        request.ExpressionAttributeNames['#MyRange'].should.equal('MyRange');

        request.ExpressionAttributeValues.should.have.property(':p0');
        request.ExpressionAttributeValues.should.have.property(':p1');
        request.ExpressionAttributeValues[':p0'].should.equal('my-key-value');
        request.ExpressionAttributeValues[':p1'].should.equal('my-range-value');

        request.ConditionExpression.should.equal('#MyKey <> :p0 AND #MyRange <> :p1');
        done();
      });

    });

  });

  describe('and I want to build a request for update an existing item', function () {

    describe('and the target table has a key', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey' };
      var builder = new RequestBuilder(targetTable);
      var item = { MyKey: 'my-key-value', IntValue: 1, StringValue: 'One' };
      var request = builder.update().item(item).buildRequest();

      it('then it should be targeted to the right table', function (done) {
        should(request.TableName).be.not.Null();
        request.TableName.should.equal('MyTable');
        done();
      });

      it('then it should be targeted to the right item', function (done) {
        request.should.have.property('Key');
        request.Key.should.have.property('MyKey');
        request.Key.MyKey.should.equal('my-key-value');
        done();
      });

      it('then it should ensure the item exists', function (done) {
        should(request.ExpressionAttributeNames).be.an.Object();
        should(request.ExpressionAttributeValues).be.an.Object();
        should(request.ConditionExpression).be.a.String();

        request.ExpressionAttributeNames.should.have.property('#MyKey');
        request.ExpressionAttributeNames['#MyKey'].should.equal('MyKey');

        request.ExpressionAttributeValues.should.have.property(':p0');
        request.ExpressionAttributeValues[':p0'].should.equal('my-key-value');

        request.ConditionExpression.should.equal('#MyKey = :p0');
        done();
      });

      it('then it should update all item field except the key', function (done) {

        request.ExpressionAttributeNames.should.have.property('#IntValue');
        request.ExpressionAttributeNames.should.have.property('#StringValue');
        request.ExpressionAttributeNames['#IntValue'].should.equal('IntValue');
        request.ExpressionAttributeNames['#StringValue'].should.equal('StringValue');

        request.ExpressionAttributeValues.should.have.property(':p1');
        request.ExpressionAttributeValues.should.have.property(':p2');
        request.ExpressionAttributeValues[':p1'].should.equal(1);
        request.ExpressionAttributeValues[':p2'].should.equal('One');

        request.ConditionExpression.should.equal('#MyKey = :p0');
        request.UpdateExpression.should.equal('set #IntValue = :p1, #StringValue = :p2');
        done();
      });

    });

    describe('and the target table has key and range', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey', range: 'MyRange' };
      var builder = new RequestBuilder(targetTable);
      var item = { MyKey: 'my-key-value', MyRange: 'my-range-value', IntValue: 1, StringValue: 'One' };
      var request = builder.update().item(item).buildRequest();

      it('then it should be targeted to the right item', function (done) {
        request.should.have.property('Key');
        request.Key.should.have.property('MyKey');
        request.Key.should.have.property('MyRange');
        request.Key.MyKey.should.equal('my-key-value');
        request.Key.MyRange.should.equal('my-range-value');
        done();
      });

      it('then it should ensure the item exists', function (done) {
        should(request.ExpressionAttributeNames).be.an.Object();
        should(request.ExpressionAttributeValues).be.an.Object();
        should(request.ConditionExpression).be.a.String();

        request.ExpressionAttributeNames.should.have.property('#MyKey');
        request.ExpressionAttributeNames.should.have.property('#MyRange');
        request.ExpressionAttributeNames['#MyKey'].should.equal('MyKey');
        request.ExpressionAttributeNames['#MyRange'].should.equal('MyRange');

        request.ExpressionAttributeValues.should.have.property(':p0');
        request.ExpressionAttributeValues.should.have.property(':p1');
        request.ExpressionAttributeValues[':p0'].should.equal('my-key-value');
        request.ExpressionAttributeValues[':p1'].should.equal('my-range-value');

        request.ConditionExpression.should.equal('#MyKey = :p0 AND #MyRange = :p1');
        done();
      });

      it('then it should update all item field except key and range', function (done) {

        request.ExpressionAttributeNames.should.have.property('#IntValue');
        request.ExpressionAttributeNames.should.have.property('#StringValue');
        request.ExpressionAttributeNames['#IntValue'].should.equal('IntValue');
        request.ExpressionAttributeNames['#StringValue'].should.equal('StringValue');

        request.ExpressionAttributeValues.should.have.property(':p2');
        request.ExpressionAttributeValues.should.have.property(':p3');
        request.ExpressionAttributeValues[':p2'].should.equal(1);
        request.ExpressionAttributeValues[':p3'].should.equal('One');

        request.ConditionExpression.should.equal('#MyKey = :p0 AND #MyRange = :p1');
        request.UpdateExpression.should.equal('set #IntValue = :p2, #StringValue = :p3');
        done();
      });

    });

    describe('and the target table has a version field', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey', version: 'Version' };
      var builder = new RequestBuilder(targetTable);
      var item = { MyKey: 'my-key-value', Value: 1 };
      var request = builder.update().item(item).buildRequest();

      it('then it should atomically increase the item version number to prevent concurrency', function (done) {

        request.ExpressionAttributeNames.should.have.property('#Version');
        request.ExpressionAttributeNames['#Version'].should.equal('Version');

        request.ExpressionAttributeValues.should.have.property(':p1');
        request.ExpressionAttributeValues[':p1'].should.equal(1);

        request.ConditionExpression.should.equal('#MyKey = :p0');
        request.UpdateExpression.should.equal('add #Version :p1 set #Value = :p2');
        done();
      });

    });

    describe('and the target table has a nested version field', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey', version: 'Audit.Version' };
      var builder = new RequestBuilder(targetTable);
      var item = { MyKey: 'my-key-value', Value: 1 };
      var request = builder.update().item(item).buildRequest();

      it('then it should atomically increase the item version number to prevent concurrency', function (done) {

        request.ExpressionAttributeNames.should.have.property('#Audit');
        request.ExpressionAttributeNames.should.have.property('#Version');
        request.ExpressionAttributeNames['#Audit'].should.equal('Audit');
        request.ExpressionAttributeNames['#Version'].should.equal('Version');

        request.ExpressionAttributeValues.should.have.property(':p1');
        request.ExpressionAttributeValues[':p1'].should.equal(1);

        request.ConditionExpression.should.equal('#MyKey = :p0');
        request.UpdateExpression.should.equal('add #Audit.#Version :p1 set #Value = :p2');
        done();
      });

    });

  });

  describe('and I want to build a request for update an existing item preventing concurrency', function () {

    describe('and the target table has a version field', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey', version: 'Version' };
      var builder = new RequestBuilder(targetTable);
      var item = { MyKey: 'my-key-value', Value: 'MyValue' };
      var request = builder.update().item(item).atVersion(100).buildRequest();

      it('then it should ensure the version I changed is not changed in the meanwhile', function (done) {

        request.ExpressionAttributeNames.should.have.property('#Version');
        request.ExpressionAttributeNames['#Version'].should.equal('Version');

        request.ExpressionAttributeValues.should.have.property(':p0');
        request.ExpressionAttributeValues.should.have.property(':p1');
        request.ExpressionAttributeValues.should.have.property(':p2');
        request.ExpressionAttributeValues.should.have.property(':p3');
        request.ExpressionAttributeValues[':p0'].should.equal('my-key-value');
        request.ExpressionAttributeValues[':p1'].should.equal(100);
        request.ExpressionAttributeValues[':p2'].should.equal(1);
        request.ExpressionAttributeValues[':p3'].should.equal('MyValue');

        request.ConditionExpression.should.equal('#MyKey = :p0 AND #Version = :p1');
        request.UpdateExpression.should.equal('add #Version :p2 set #Value = :p3');
        done();
      });

    });

    describe('and the target table has a nested version field', function () {

      var targetTable = { table: 'MyTable', key: 'MyKey', version: 'Audit.Version' };
      var builder = new RequestBuilder(targetTable);
      var item = { MyKey: 'my-key-value', Value: 'MyValue' };
      var request = builder.update().item(item).atVersion(100).buildRequest();

      it('then it should ensure the version I changed is not changed in the meanwhile', function (done) {

        request.ExpressionAttributeNames.should.have.property('#Audit');
        request.ExpressionAttributeNames.should.have.property('#Version');
        request.ExpressionAttributeNames['#Version'].should.equal('Version');
        request.ExpressionAttributeNames['#Audit'].should.equal('Audit');

        request.ExpressionAttributeValues.should.have.property(':p0');
        request.ExpressionAttributeValues.should.have.property(':p1');
        request.ExpressionAttributeValues.should.have.property(':p2');
        request.ExpressionAttributeValues.should.have.property(':p3');
        request.ExpressionAttributeValues[':p0'].should.equal('my-key-value');
        request.ExpressionAttributeValues[':p1'].should.equal(100);
        request.ExpressionAttributeValues[':p2'].should.equal(1);
        request.ExpressionAttributeValues[':p3'].should.equal('MyValue');

        request.ConditionExpression.should.equal('#MyKey = :p0 AND #Audit.#Version = :p1');
        request.UpdateExpression.should.equal('add #Audit.#Version :p2 set #Value = :p3');
        done();
      });

    });

  });

});
