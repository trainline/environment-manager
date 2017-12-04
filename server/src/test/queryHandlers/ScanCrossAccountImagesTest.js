/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

require('should');
const inject = require('inject-loader!../../queryHandlers/ScanCrossAccountImages');

function createFixture() {
  return inject({
    '../modules/awsAccounts': {
      all: () => Promise.resolve([
        { AccountName: 'one', AccountNumber: '1' },
        { AccountName: 'two', AccountNumber: '2' }
      ])
    },
    '../modules/resourceFactories/ec2ImageResourceFactory': {
      create: () => Promise.resolve({
        all: () => ([
          { AccountName: 'acc1', ImageType: 'machine', Name: 'windows-2012r2-ttl-app-6.0.0' },
          { AccountName: 'acc1', ImageType: 'machine', Name: 'oel-7-ttl-nodejs-0.1.5' }
        ])
      })
    }
  }
  );
}

describe('ScanCrossAccountImages', function () {
  let sut;
  const query = {
    name: 'ScanCrossAccountImages',
    filter: Object,
    timestamp: '2017-11-23T10:26:30.179Z'
  };

  it('Images have account name', function () {
    sut = createFixture();
    return sut(query).then(function (data) {
      data.every(i => i.AccountName === 'one' || i.AccountName === 'two').should.be.true();
    });
  });

  it('Images are ranked', function () {
    sut = createFixture();
    return sut(query).then(function (data) {
      data.every(i => i.Rank > 0).should.be.true();
    });
  });

  it('Images have latest field set', function () {
    sut = createFixture();
    return sut(query).then(function (data) {
      data.every(i => i.IsLatest === true || i.IsLatest === false).should.be.true();
    });
  });

  it('Images have days behind latest field set', function () {
    sut = createFixture();
    return sut(query).then(function (data) {
      data.every(i => i.DaysBehindLatest >= 0).should.be.true();
    });
  });
});
