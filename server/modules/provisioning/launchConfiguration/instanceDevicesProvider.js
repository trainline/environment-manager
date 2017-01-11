/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

// TODO(filip): why do we even need this ugly rewrite? What's wrong with operating on AWS data?
// Why add so much complexity to something that can be as simple as CRUD operation on AWS?

let _ = require('lodash');

const OS_DEVICE_NAME = '/dev/sda1';
const DATA_DEVICE_NAME = '/dev/sda2';

const DEFAULT_VOLUME = {
  Type: 'SSD',
  Size: 50,
};

module.exports = {
  toAWS: function (volumes) {

    let awsVolumes = [];

    let osVolume = _.find(volumes, { Name: 'OS' }) || DEFAULT_VOLUME;
    let osDevice = getDeviceByVolume(osVolume, OS_DEVICE_NAME);
    awsVolumes.push(osDevice);

    let dataVolume = _.find(volumes, { Name: 'Data' }) || DEFAULT_VOLUME;
    if (dataVolume.Size !== 0) {
      let dataDevice = getDeviceByVolume(dataVolume, DATA_DEVICE_NAME, true);
      awsVolumes.push(dataDevice);
    }

    return awsVolumes;
  },
  // reverse function
  fromAWS: function (awsVolumes) {
    return awsVolumes.filter((vol) => {
      return _.includes([ OS_DEVICE_NAME, DATA_DEVICE_NAME], vol.DeviceName);
    }).map((awsVolume) => {
      let volume = {};
      volume.Name = awsVolume.DeviceName === OS_DEVICE_NAME ? 'OS' : 'Data';
      volume.Size = awsVolume.Ebs.VolumeSize;
      volume.Type = awsVolume.Ebs.VolumeType === 'standard' ? 'Disk' : 'SSD';
      return volume;
    }).sort((vol1, vol2) => {
      // sda1 before sda2 etc.
      return vol1.Name < vol2.Name;
    });
  },
};

function getDeviceByVolume(dataVolume, name, encrypted) {
  return {
    DeviceName: name,
    Ebs: {
      DeleteOnTermination: true,
      VolumeSize: dataVolume.Size,
      VolumeType: dataVolume.Type.toLowerCase() === 'ssd' ? 'gp2' : 'standard',
      Encrypted: encrypted,
    }
  };
}

