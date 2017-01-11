/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require("should");
let validator = require("modules/deployment/validators/rootDeviceSizeValidator");

const deployment = null;

describe("CreateLaunchConfigurationCommandValidator", function() {

  context("Root device is large enough for AMI", function() {
    let configuration = {
      image: { rootVolumeSize: 10 },
      serverRole: {
        Volumes: [
          { Name: "Data", Size: 9 },
          { Name: "OS", Size: 10 }
        ]
      }
    }; 
    it("No errors reported", function () {
      return validator.validate(deployment, configuration).should.be.fulfilled();
    });
  });

  context("No root device specified", function() {
    let configuration = {
      image: { rootVolumeSize: 10 },
      serverRole: {
        ServerRoleName: "MyServerRole",
        Volumes: [
          { Name: "Data", Size: 10 }
        ]
      }
    }; 
    it("Reports the correct error for missing root device", function () {
      return validator.validate(deployment, configuration).should.be.rejectedWith(/Server role "MyServerRole" has no OS volume\./);
    });
  });

  context("Root device is too small for AMI", function() {
    let configuration = {
      image: { name: "my-ami", rootVolumeSize: 10 },
      serverRole: {
        ServerRoleName: "MyServerRole",
        Volumes: [
          { Name: "Data", Size: 10 },
          { Name: "OS", Size: 9 }
        ]
      }
    }; 
    it("Reports the correct error for incorrect root device size", function () {
      return validator.validate(deployment, configuration).should.be.rejectedWith(/Server role "MyServerRole" has an OS volume of 9 GB but uses AMI "my-ami" which requires at least 10 GB\./);
    });
  });
});