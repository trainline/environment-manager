/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sut = require('../../../modules/machineImage/imageSummary');

describe('imageSummary', function () {

  describe('isStable', function () {
    context('when the image has a stable tag', function () {
      it('return true', function () {
        sut.isStable({ Tags: [{ Key: 'sTaBlE', Value: 1 }] }).should.be.true();
      });
    });

    context('when the image has a stable description', function () {
      it('return false', function () {
        sut.isStable({ Description: 'StAbLe' }).should.be.true();
      });
    });

    context('when the image is not stable', function () {
      let testCases = [
        { Tags: [{ Key: 'sTaBlE', Value: '' }] },
        { Description: 'not quite StAbLe' },
      ];

      for (let testCase of testCases) {
        it('returns false when description is ' + testCase.Description, function () {
          sut.isStable(testCase).should.be.false();
        });
      }
    });
  });

  describe('isCompatibleImage', function () {
    context('when the image is a Trainline one', function () {
      it('return true', function () {
        sut.isCompatibleImage('whatever-name-0.0.0').should.be.true();
      });
    });

    context('when the image is not a Trainline one', function () {
      it('return false', function () {
        sut.isCompatibleImage('some-amazon-image').should.be.false();
      });
    });
  });

  describe('getAmiType', function () {
    context('when the image is a Trainline one', function () {
      it('return AMI type', function () {
        sut.getAmiType('my-AMI-type-0.0.0').should.be.equal('my-AMI-type');
      });
    });

    context('when the image is not a Trainline one', function () {
      it('return full AMI name', function () {
        sut.getAmiType('some-amazon-image').should.be.equal('some-amazon-image');
      });
    });
  });

  describe('getAmiVersion', function () {
    context('when the image is a Trainline one', function () {
      it('return AMI version', function () {
        sut.getAmiVersion('my-AMI-type-1.2.3').should.be.equal('1.2.3');
      });
    });

    context('when the image is not a Trainline one', function () {
      it('return empty string', function () {
        sut.getAmiVersion('some-amazon-image-0.0').should.be.equal('');
      });
    });
  });

  describe('compare', function () {

    let testCases = [
      { x: null, y: null, result: 0 },
      { x: { AmiType: null, AmiVersion: null }, y: { AmiType: null, AmiVersion: null }, result: 0 },
      { x: { AmiType: null, AmiVersion: null }, y: { AmiType: null, AmiVersion: '0.0.0' }, result: 0 },
      { x: { AmiType: null, AmiVersion: null }, y: { AmiType: '', AmiVersion: null }, result: 0 },

      { x: { AmiType: null, AmiVersion: '0.0.0' }, y: { AmiType: null, AmiVersion: '0.0.0' }, result: 0 },
      { x: { AmiType: null, AmiVersion: '0.0.0' }, y: { AmiType: null, AmiVersion: '0.0.1' }, result: 1 },

      { x: { AmiType: 'A', AmiVersion: null }, y: { AmiType: 'A', AmiVersion: null }, result: 0 },
      { x: { AmiType: 'A', AmiVersion: null }, y: { AmiType: 'B', AmiVersion: null }, result: -1 },

      { x: { AmiType: 'A', AmiVersion: '0.0.0' }, y: { AmiType: 'B', AmiVersion: '0.0.1' }, result: -1 },
      { x: { AmiType: 'A', AmiVersion: '0.0.1' }, y: { AmiType: 'B', AmiVersion: '0.0.0' }, result: -1 },
    ];

    for (let testCase of testCases) {
      context(`${JSON.stringify(testCase.x)}, ${JSON.stringify(testCase.y)}`, function () {
        it(`return ${testCase.result}`, function () {
          Math.sign(sut.compare(testCase.x, testCase.y)).should.be.equal(testCase.result);
        });
      });
    }
  });

  describe('rank', function () {

    let testCases = [
      [
        { AmiType: 'A', AmiVersion: '0.0.1', IsStable: false, IsLatest: true, IsLatestStable: false, Rank: 1 },
      ],
      [
        { AmiType: 'A', AmiVersion: '0.0.1', IsStable: true, IsLatest: true, IsLatestStable: true, Rank: 1 },
      ],
      [
        { AmiType: 'A', AmiVersion: '0.0.1', IsStable: true, IsLatest: false, IsLatestStable: true, Rank: 2 },
        { AmiType: 'A', AmiVersion: '0.0.2', IsStable: false, IsLatest: true, IsLatestStable: false, Rank: 1 },
      ],
      [
        { AmiType: 'A', AmiVersion: '0.0.1', IsStable: false, IsLatest: false, IsLatestStable: false, Rank: 3 },
        { AmiType: 'A', AmiVersion: '0.0.2', IsStable: true, IsLatest: false, IsLatestStable: true, Rank: 2 },
        { AmiType: 'A', AmiVersion: '0.0.3', IsStable: false, IsLatest: true, IsLatestStable: false, Rank: 1 },
      ],
      [
        { AmiType: 'A', AmiVersion: '0.0.1', IsStable: true, IsLatest: false, IsLatestStable: true, Rank: 2 },
        { AmiType: 'A', AmiVersion: '0.0.2', IsStable: false, IsLatest: true, IsLatestStable: false, Rank: 1 },
        { AmiType: 'B', AmiVersion: '0.0.1', IsStable: false, IsLatest: false, IsLatestStable: false, Rank: 3 },
        { AmiType: 'B', AmiVersion: '0.0.2', IsStable: true, IsLatest: false, IsLatestStable: true, Rank: 2 },
        { AmiType: 'B', AmiVersion: '0.0.3', IsStable: false, IsLatest: true, IsLatestStable: false, Rank: 1 },
      ],
    ];

    for (let testCase of testCases) {
      testCase.sort(sut.compare);
      let input = testCase.map(x => {
        let y = Object.assign({}, x);
        delete y.IsLatest;
        delete y.IsLatestStable;
        delete y.Rank;
        return y;
      });

      context(`${JSON.stringify(input)}`, function () {
        it(`should return ${JSON.stringify(testCase)}`, function () {
          sut.rank(input).should.match(testCase);
        });
      });
    }

    let daysBehindLatestTestCases = [
      [
        { AmiType: 'A', AmiVersion: '0.0.1', IsStable: false, CreationDate: '2000-01-01T00:00:00.000Z', DaysBehindLatest: 0 },
      ],
      [
        { AmiType: 'A', AmiVersion: '0.0.1', IsStable: true, CreationDate: '2000-01-01T00:00:00.000Z', DaysBehindLatest: 0 },
      ],
      [
        { AmiType: 'A', AmiVersion: '0.0.1', IsStable: true, CreationDate: '2000-01-01T00:00:00.000Z', DaysBehindLatest: 0 },
        { AmiType: 'A', AmiVersion: '0.0.2', IsStable: false, CreationDate: '2000-01-02T00:00:00.000Z', DaysBehindLatest: 0 },
      ],
      [
        { AmiType: 'A', AmiVersion: '0.0.1', IsStable: true, CreationDate: '2000-01-01T00:00:00.000Z', DaysBehindLatest: 1 },
        { AmiType: 'A', AmiVersion: '0.0.2', IsStable: true, CreationDate: '2000-01-02T00:00:00.000Z', DaysBehindLatest: 0 },
      ],
      [
        { AmiType: 'A', AmiVersion: '0.0.1', IsStable: true, CreationDate: '2000-01-01T00:00:00.000Z', DaysBehindLatest: 1 },
        { AmiType: 'A', AmiVersion: '0.0.2', IsStable: true, CreationDate: '2000-01-02T00:00:00.000Z', DaysBehindLatest: 0 },
        { AmiType: 'A', AmiVersion: '0.0.3', IsStable: false, CreationDate: '2000-01-03T00:00:00.000Z', DaysBehindLatest: 0 },
      ],
      [
        { AmiType: 'A', AmiVersion: '0.0.1', IsStable: true, CreationDate: '2000-01-01T00:00:00.000Z', DaysBehindLatest: 2 },
        { AmiType: 'A', AmiVersion: '0.0.2', IsStable: false, CreationDate: '2000-01-02T00:00:00.000Z', DaysBehindLatest: 1 },
        { AmiType: 'A', AmiVersion: '0.0.3', IsStable: true, CreationDate: '2000-01-03T00:00:00.000Z', DaysBehindLatest: 0 },
      ],
      [
        { AmiType: 'A', AmiVersion: '0.0.1', IsStable: true, CreationDate: '2000-01-01T00:00:00.000Z', DaysBehindLatest: 1 },
        { AmiType: 'A', AmiVersion: '0.0.2', IsStable: true, CreationDate: '2000-01-02T00:00:00.000Z', DaysBehindLatest: 0 },
        { AmiType: 'A', AmiVersion: '0.0.3', IsStable: false, CreationDate: '2000-01-03T00:00:00.000Z', DaysBehindLatest: 0 },
        { AmiType: 'B', AmiVersion: '0.0.1', IsStable: true, CreationDate: '2000-01-01T00:00:00.000Z', DaysBehindLatest: 2 },
        { AmiType: 'B', AmiVersion: '0.0.2', IsStable: true, CreationDate: '2000-01-02T00:00:00.000Z', DaysBehindLatest: 1 },
        { AmiType: 'B', AmiVersion: '0.0.3', IsStable: true, CreationDate: '2000-01-03T00:00:00.000Z', DaysBehindLatest: 0 },
      ],
    ];

    for (let testCase of daysBehindLatestTestCases) {
      testCase.sort(sut.compare);
      let input = testCase.map(x => {
        let y = Object.assign({}, x);
        delete y.DaysBehindLatest;
        return y;
      });

      context(`${JSON.stringify(input)}`, function () {
        it(`should return ${JSON.stringify(testCase)}`, function () {
          sut.rank(input).should.match(testCase);
        });
      });
    }
  });

  describe('summaryOf', function () {
    context('when the image has a tag with key "Name"', function () {
      it('The "Name" property of the image summary should not be overwritten', function () {
        sut.summaryOf({
          Name: 'windows-2012r2-ttl-app-7.0.17',
          Tags: [{ Key: 'Name', Value: '' }]
        }).should.have.property('Name').eql('windows-2012r2-ttl-app-7.0.17');
      });
    });
  });
});

