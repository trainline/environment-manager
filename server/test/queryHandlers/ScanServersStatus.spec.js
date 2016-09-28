/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let proxyquire = require('proxyquire');
let AutoScalingGroup = require('models/AutoScalingGroup');
let _ = require('lodash');

function stubSender(responseStubs) {
  return {
    sendQuery: obj => {
      let query = obj.query;
      let name = query.name;
      if (responseStubs.hasOwnProperty(name)) {
        return responseStubs[name](query);
      } else {
        throw new Error(`No stubbed response was supplied for the request: ${JSON.stringify(query, null, 2)}.`);
      }
    },
  };
}

function sutWithSender(mockedSender) {
  let sut = proxyquire('queryHandlers/ScanServersStatus', {
    'modules/sender': mockedSender,
  });
  return sut;
}

describe('ScanServersStatus', function () {
  context('when there are some terminated servers', function () {
    let read = p => Promise.resolve(require(p));

    let consulNodeDetails = read('./ScanServersStatus-getConsulNode.json');
    function stubConsulNode(query) {
      return consulNodeDetails.then(allNodeDetails => allNodeDetails[query.nodeName]);
    }

    let responseStubs = {
      GetNode: stubConsulNode,
      ScanAutoScalingGroups: () => Promise.resolve(_.map(require('./ScanServersStatus-getAllAsgs.json'), (asg) => new AutoScalingGroup(asg))),
      GetAllNodes: () => read('./ScanServersStatus-getAllConsulNodes.json'),
      ScanCrossAccountImages: () => read('./ScanServersStatus-getAllImages.json'),
      ScanCrossAccountInstances: () => read('./ScanServersStatus-getAllInstances.json'),
      GetAutoScalingGroupScheduledActions: () => { return Promise.resolve([]); }
    };

    it('then the services that were on them should be hidden', function () {
      this.timeout(10000);

      let stubbedSender = stubSender(responseStubs);
      let sut = sutWithSender(stubbedSender);
      let query = {
        environmentName: 'c06',
        filter: {
          cluster: undefined,
        },
      };
      return sut(query).then(results =>
        results.Value.find(x => x.Name === 'c06-rm-ReferenceDataProviderServices').Services)
          .should.eventually.eql([
            {
              Name: 'c06-RetailControlServiceData',
              FriendlyName: 'RetailControlServiceData',
              Version: '1.1.1-alpha99',
              Slice: 'none',
            },
          ]);
    });
  });
});
