/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require("should");
let sinon = require("sinon");
let imageSummary = require('../../../../modules/machineImage/imageSummary');
const inject = require('inject-loader!../../../../modules/provisioning/launchConfiguration/imageProvider');

describe("ImageProvider", () => {
  describe('with an AMI image name', () => {
    it("resolves the  AWS Image representation", () => {
      let expectedImage = {
        ImageId: "ami-979734e4",
        CreationDate: new Date("2016-05-04"),
        Name: "oel-7-ttl-nodejs-0.1.4",
        RootDeviceName: "/dev/sda1",
        BlockDeviceMappings: [
          {
            DeviceName: "/dev/sda1",
            Ebs: {
              SnapshotId: "snap-00000001",
              VolumeSize: 15,
              VolumeType: "gp2",
              Encrypted: true
            }
          }
        ]
      };

      let senderMock = {
        sendQuery: sinon.stub().returns(Promise.resolve([expectedImage].map(imageSummary.summaryOf).sort(imageSummary.compare)))
      };
      let imageNameOrType = "oel-7-ttl-nodejs-0.1.4";
      let target = inject({
        '../../sender': senderMock
      });
      let promise = target.get(imageNameOrType);
      
      return promise.then(image => {
        should(image).not.be.null();
        should(image).not.be.undefined();
        image.id.should.be.equal("ami-979734e4");
        image.name.should.be.equal("oel-7-ttl-nodejs-0.1.4");
        image.type.should.be.equal("oel-7-ttl-nodejs");
        image.version.should.be.equal("0.1.4");
        image.encrypted.should.be.true();

        senderMock.sendQuery.called.should.be.true();
        senderMock.sendQuery.getCall(0).args[1].should.match({
          query: {
            name: "ScanCrossAccountImages",
            filter: {
              name: imageNameOrType
            }
          }
        });
      });
    });

    describe("and specified image does not exist in AWS", () => {
      it("rejects with the expected error", () => {
        let senderMock = {
          sendQuery: sinon.stub().returns(Promise.resolve([]))
        };

        let imageNameOrType = "oel-7-ttl-nodejs-0.1.4";
        let target = inject({
          '../../sender': senderMock
        });
        let promise = target.get(imageNameOrType);

        return promise.catch(error => {
          error.toString().should.be.containEql('No AMI image "oel-7-ttl-nodejs-0.1.4" found.');
        });
      });
    });
  });

  describe('with a given AMI type', () => {
    it("returns the latest AMI image of the specified type", () => {
      let createMockImage = (name, id, date, version) => ({
        ImageId: id,
        CreationDate: new Date(date),
        Name: `${name}-${version}`,
        RootDeviceName: "/dev/sda1",
        BlockDeviceMappings: [
          {
            DeviceName: "/dev/sda1",
            Ebs: {
              SnapshotId: "snap-00000001",
              VolumeSize: 15,
              VolumeType: "gp2",
              Encrypted: true
            }
          }
        ]
      });

      let mockVersions = [
        createMockImage('oel-7-ttl-nodejs', 'ami-979734e4', '2016-05-04', '0.1.4'),
        createMockImage('oel-7-ttl-nodejs', 'ami-dedc63ad', '2016-01-01', '0.0.1'),
        createMockImage('oel-7-ttl-vanilla', 'ami-5e1e0a3e', '2016-05-03', '0.2.0'),
      ];

      let images = mockVersions.map(imageSummary.summaryOf).sort(imageSummary.compare);
      images = imageSummary.rank(images);

      let senderMock = {
        sendQuery: sinon.stub().returns(Promise.resolve(images))
      };

      let imageNameOrType = "oel-7-ttl-nodejs";
      let target = inject({
        '../../sender': senderMock
      });

      return target.get(imageNameOrType, true).then(image => {
        should(image).not.be.null();
        should(image).not.be.undefined();

        image.id.should.be.equal("ami-979734e4");
        image.name.should.be.equal("oel-7-ttl-nodejs-0.1.4");
        image.type.should.be.equal("oel-7-ttl-nodejs");
        image.version.should.be.equal("0.1.4");

        senderMock.sendQuery.called.should.be.true();
        senderMock.sendQuery.getCall(0).args[1].should.match({
          query: {
            name: "ScanCrossAccountImages"
          }
        });
      });
    });

    describe("and no image of the specified type exists in AWS", () => {
      it("should be possible to understand the error", () => {
        let newestVanillaImage = {
          ImageId: "ami-000001",
          CreationDate: new Date("2016-05-05"),
          Name: "oel-7-ttl-vanilla-0.2.0",
          RootDeviceName: "/dev/sda1",
          BlockDeviceMappings: [
            {
              DeviceName: "/dev/sda1",
              Ebs: {
                SnapshotId: "snap-00000001",
                VolumeSize: 15,
                VolumeType: "gp2",
                Encrypted: true
              }
            }
          ]
        };

        let oldestVanillaImage = {
          ImageId: "ami-000000",
          CreationDate: new Date("2016-01-01"),
          Name: "oel-7-ttl-vanilla-0.0.1",
          RootDeviceName: "/dev/sda1",
          BlockDeviceMappings: [
            {
              DeviceName: "/dev/sda1",
              Ebs: {
                SnapshotId: "snap-00000001",
                VolumeSize: 15,
                VolumeType: "gp2",
                Encrypted: true
              }
            }
          ]
        };

        let senderMock = {
          sendQuery: sinon.stub().returns(Promise.resolve([
            newestVanillaImage,
            oldestVanillaImage
          ].map(imageSummary.summaryOf).sort(imageSummary.compare)))
        };

        let imageNameOrType = "oel-7-ttl-nodejs";
        let target = inject({
          '../../sender': senderMock
        });

        let promise = target.get(imageNameOrType);
        return promise.catch(error => {
          error.toString().should.be.containEql('No AMI image of type "oel-7-ttl-nodejs" found.');
        });
      });
    });
  });
});

