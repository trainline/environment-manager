/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon = require('sinon');
let rewire = require('rewire');

let _ = require('lodash');

let Enums = require('Enums');
let DIFF_STATE = Enums.DIFF_STATE;
let HEALTH_STATUS = Enums.HEALTH_STATUS;

describe('getASGState', () => {
  let getASGState = rewire('modules/environment-state/getASGState');

  describe('getServicesSummary', () => {
    let getServicesSummary;
    let testData;
    let origTestData = [{
        "Name": "TestService0",
        "Version": "asdasfas",
        "Slice": "none",
        "DiffWithTargetState": "Ignored",
        "DeploymentId": "7b131880-b57c-11e6-840b-df8445a74c58",
        "InstancesCount": {
            "Healthy": 0,
            "Total": 3
        },
        "InstancesHealthCount": "0/3",
        "OverallHealth": {
            "Status": "Error"
        },
        "Action": "Ignore"
    }, {
        "Name": "TestService0",
        "Version": "ver2-green",
        "Slice": "green",
        "DiffWithTargetState": null,
        "DeploymentId": "82911b10-acb3-11e6-851a-39db0d121c3d",
        "InstancesCount": {
            "Healthy": 0,
            "Total": 3
        },
        "InstancesHealthCount": "0/3",
        "OverallHealth": {
            "Status": "Error"
        },
    }, {
        "Name": "TestService13",
        "Version": "ver-1",
        "Slice": "none",
        "DiffWithTargetState": null,
        "DeploymentId": "9fcc48b0-b0c5-11e6-93e2-611849e58087",
        "InstancesCount": {
            "Healthy": 0,
            "Total": 3
        },
        "InstancesHealthCount": "0/3",
        "OverallHealth": {
            "Status": "Error"
        },
    }, {
        "Name": "TestService3",
        "Version": "vtest-new2",
        "Slice": "none",
        "DiffWithTargetState": null,
        "DeploymentId": "64ccec60-5986-11e6-a33e-ab3fc7e4873e",
        "InstancesCount": {
            "Healthy": 3,
            "Total": 3
        },
        "InstancesHealthCount": "3/3",
        "OverallHealth": {
            "Status": "Healthy"
        },
    }, {
        "Name": "TestService4",
        "Version": "0.0.123",
        "Slice": "none",
        "DiffWithTargetState": null,
        "DeploymentId": "7c18a2a0-7386-11e6-9303-63977ad16e16",
        "InstancesCount": {
            "Healthy": 3,
            "Total": 3
        },
        "InstancesHealthCount": "3/3",
        "OverallHealth": {
            "Status": "Healthy"
        },
    }, {
        "Name": "BasketService",
        "Version": "0.4.0.7-alpha1",
        "Slice": "blue",
        "DiffWithTargetState": "Missing",
        "DeploymentId": "833f75e0-ab26-11e6-bd12-153c9238eba7",
        "InstancesCount": {
            "Healthy": 0,
            "Total": 3
        },
        "InstancesHealthCount": "0/3",
        "OverallHealth": {
            "Status": "Healthy"
        },
    }, {
        "Name": "TestService0",
        "Version": "ver-1-blue",
        "Slice": "blue",
        "DiffWithTargetState": "Missing",
        "DeploymentId": "156d4310-ac1d-11e6-851a-39db0d121c3d",
        "InstancesCount": {
            "Healthy": 0,
            "Total": 3
        },
        "InstancesHealthCount": "0/3",
        "OverallHealth": {
            "Status": "Healthy"
        },
    }, {
        "Name": "TestService2",
        "Version": "test-new2",
        "Slice": "none",
        "DiffWithTargetState": "Missing",
        "DeploymentId": "41b53860-5975-11e6-af7f-f3054c5aebe7",
        "InstancesCount": {
            "Healthy": 0,
            "Total": 3
        },
        "InstancesHealthCount": "0/3",
        "OverallHealth": {
            "Status": "Healthy"
        },
    }];

    beforeEach(() => {
        getServicesSummary = getASGState.__get__('getServicesSummary');
        testData = _.clone(origTestData);
    });

    it('gives right summary for not present and unhealthy', () => {

        let result = getServicesSummary(testData);

        let expected = {
            AllServicesPresent: false,
            AllServicesPresentAndHealthy: false,
            ServicesCount: {
                Present: 4,
                PresentWithUnexpected: 4,
                PresentAndHealthy: 2,
                Ignored: 1,
                Total: 7
            },
            "MissingServices": [
              {
                "Name": "BasketService",
                "Slice": "blue",
                "Version": "0.4.0.7-alpha1",
              },
              {
                "Name": "TestService0",
                "Slice": "blue",
                "Version": "ver-1-blue"
              },
              {
                "Name": "TestService2",
                "Slice": "none",
                "Version": "test-new2"
              }
            ],
            PresentServices: [{
                "Name": "TestService0",
                "Slice": "green",
                "Version": "ver2-green"
            }, {
                "Name": "TestService13",
                "Slice": "none",
                "Version": "ver-1"
            }, {
                "Name": "TestService3",
                "Slice": "none",
                "Version": "vtest-new2"
            }, {
                "Name": "TestService4",
                "Slice": "none",
                "Version": "0.0.123"
            }]
        };

        result.should.be.eql(expected);
    });

    it('gives right summary for ASG with all present services, some unhealthy', () => {

        _(testData).filter({ DiffWithTargetState: 'Missing' }).each((s) => {
          s.DiffWithTargetState = null;
        });

        let result = getServicesSummary(testData);

        let expected = {
            AllServicesPresent: true,
            AllServicesPresentAndHealthy: false,
            ServicesCount: {
                Present: 7,
                PresentWithUnexpected: 7,
                PresentAndHealthy: 5,
                Ignored: 1,
                Total: 7
            },
            "MissingServices": [
              
            ],
            PresentServices: [{
                "Name": "TestService0",
                "Slice": "green",
                "Version": "ver2-green"
            }, {
                "Name": "TestService13",
                "Slice": "none",
                "Version": "ver-1"
            }, {
                "Name": "TestService3",
                "Slice": "none",
                "Version": "vtest-new2"
            }, {
                "Name": "TestService4",
                "Slice": "none",
                "Version": "0.0.123"
            }, {
              "Name": "BasketService",
              "Slice": "blue",
              "Version": "0.4.0.7-alpha1",
            },
            {
              "Name": "TestService0",
              "Slice": "blue",
              "Version": "ver-1-blue"
            },
            {
              "Name": "TestService2",
              "Slice": "none",
              "Version": "test-new2"
            }]
        };

        result.should.be.eql(expected);
    });
  });
});
