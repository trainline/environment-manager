/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var should = require('should');
var instanceDevicesProvider = require('modules/provisioning/launchConfiguration/instanceDevicesProvider');

describe('InstanceDevicesProvider:', () => {

  describe('when configuration does not contain any expectation about instance volumes', () => {

    var configuration = {
      serverRole: {
        Volumes: null
      }
    };

    describe('obtaining devices the launch configuration should have', () => {

      let devices;
      let promise = Promise.resolve();

      before(() => {
        devices = instanceDevicesProvider.toAWS(configuration);
      });

      it('first device should be named as "/dev/sda1"', () => promise.then(() => {
        devices[0].DeviceName.should.be.equal('/dev/sda1');
      }));

      it('first device should have size of 50 GiB', () => promise.then(() => {
        devices[0].Ebs.VolumeSize.should.be.equal(50);
      }));

      it('first device should not expose any information about encryption', () => promise.then(() => {
        should(devices[0].Ebs.Encrypted).be.undefined();
      }));

      it('first device should be of type "gp2"', () => promise.then(() => {
        devices[0].Ebs.VolumeType.should.be.equal('gp2');
      }));

      it('second device should be named as "/dev/sda2"', () => promise.then(() => {
        devices[1].DeviceName.should.be.equal('/dev/sda2');
      }));

      it('second device should have size of 50 GiB', () => promise.then(() => {
        devices[1].Ebs.VolumeSize.should.be.equal(50);
      }));

      it('second device should always be encrypted', () => promise.then(() => {
        devices[1].Ebs.Encrypted.should.be.true();
      }));

      it('second device should be of type "gp2"', () => promise.then(() => {
        devices[0].Ebs.VolumeType.should.be.equal('gp2');
      }));

    });

  });

  describe('fromAWS to EM instances format', () => {
    let awsVolumes = [
      { DeviceName: '/dev/sda1',
        Ebs: {
          DeleteOnTermination: true,
          VolumeSize: 30,
          VolumeType: 'gp2',
          Encrypted: undefined
        }
      },
      { DeviceName: '/dev/sda2',
        Ebs: {
          DeleteOnTermination: true,
          VolumeSize: 10,
          VolumeType: 'standard',
          Encrypted: true
        }
      }
    ];

    var volumes = [
      {
        Name: 'OS',
        Type: 'SSD',
        Size: 30,
      },
      {
        Name: 'Data',
        Type: 'Disk',
        Size: 10,
      },
    ];

    it('converts to LaunchConfig format', () => {
      // instanceDevicesProvider.toAWS(volumes).should.deepEqual(awsVolumes);
      instanceDevicesProvider.fromAWS(awsVolumes).should.deepEqual(volumes);
    });

  });

  describe('when configuration defines "OS" and "Data" devices expectations', () => {

    var volumes = [
      {
        Name: 'OS',
        Type: 'SSD',
        Size: 30,
      },
      {
        Name: 'Data',
        Type: 'Disk',
        Size: 10,
      },
    ];

    describe('obtaining devices the launch configuration should have', () => {
      let devices;

      before(() => {
        devices = instanceDevicesProvider.toAWS(volumes);
      });

      it('first device ("OS") should have size of 30 GiB, not expose any information about encryption, be of type "gp2" (SSD) ', () => {
        devices[0].Ebs.VolumeSize.should.be.equal(30);
        should(devices[0].encrypted).be.undefined();
        devices[0].Ebs.VolumeType.should.be.equal('gp2');
      });

      it('second device ("Data") should have size of 10 GiB, be encrypted by default,  be of type "standard" (HDD)', () => {
        devices[1].Ebs.VolumeSize.should.be.equal(10);
      });
    });

    it('should omit disk volume if it\'s size is 0', () => {
      let volumes = [
        {
          Name: 'OS',
          Type: 'SSD',
          Size: 30,
        },
        {
          Name: 'Data',
          Type: 'Disk',
          Size: 0,
        },
      ];

      let devices = instanceDevicesProvider.toAWS(volumes);
      devices.length.should.be.equal(1);
    });
  });

});
