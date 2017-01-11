/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash/fp');
let semver = require('semver');

module.exports = {
  isCompatibleImage,
  isStable,
  getAmiType,
  getAmiVersion,
  getRootDevice,
  summaryOf,
  compare,
  rank,
};

function isCompatibleImage(amiName) {
  // whatever-name-0.0.0
  return /^[a-zA-Z0-9.-]+-[0-9]+\.[0-9]+\.[0-9]+$/.test(amiName);
}

function getAmiType(name) {
  let amiType = name;
  if (name && isCompatibleImage(name)) {
    let pos = name.lastIndexOf('-');
    if (pos) amiType = name.substr(0, pos);
  }

  return amiType;
}

function getAmiVersion(name) {
  let amiVersion = '';
  if (name && isCompatibleImage(name)) {
    let pos = name.lastIndexOf('-');
    if (pos) amiVersion = name.substr(pos + 1);
  }

  return amiVersion;
}

function getRootDevice(ec2image) {
  if (!ec2image.RootDeviceName) return null;
  if (!ec2image.BlockDeviceMappings) return null;

  let rootDevice = ec2image.BlockDeviceMappings.find(mapping =>
    mapping.DeviceName === ec2image.RootDeviceName
  );

  return rootDevice;
}

function summaryOf(ec2Image) {
  let name = ec2Image.Name;
  let rootDevice = getRootDevice(ec2Image);
  let tags = _.flow([_.map(tag => [tag.Key, tag.Value]), _.fromPairs])(ec2Image.Tags);
  let summary = {
    ImageId: ec2Image.ImageId,
    CreationDate: ec2Image.CreationDate,
    Platform: ec2Image.Platform ? 'Windows' : 'Linux',
    Name: name,
    Description: ec2Image.Description || '',
    AmiType: getAmiType(name),
    AmiVersion: getAmiVersion(name),
    IsCompatibleImage: isCompatibleImage(name),
    IsStable: isStable(ec2Image),
    Encrypted: _.get('Ebs.Encrypted')(rootDevice),
    RootVolumeSize: _.get('Ebs.VolumeSize')(rootDevice),
  };

  return Object.assign(tags, summary);
}

function compare(summaryImageX, summaryImageY) {
  if (summaryImageX && summaryImageY) {
    let x = comparable(summaryImageX);
    let y = comparable(summaryImageY);
    return (2 * Math.sign(x.amiType.localeCompare(y.amiType))) + Math.sign(semver.rcompare(x.amiVersion, y.amiVersion));
  } else if (summaryImageX) {
    return 1;
  } else if (summaryImageY) {
    return -1;
  } else {
    return 0;
  }
}

function rank(summaries) {
  let prev = { AmiType: null };
  let prevStable = { AmiType: null };
  let i = 0;
  for (let summary of summaries) {
    let isLatest = (summary.AmiType !== prev.AmiType);
    i = isLatest ? 1 : 1 + i;
    summary.Rank = i;
    summary.IsLatest = isLatest;
    summary.IsLatestStable = (summary.AmiType !== prevStable.AmiType && summary.IsStable);
    prev = summary;
    if (summary.IsStable) {
      prevStable = summary;
    }
  }

  return summaries;
}

function comparable(summary) {
  return {
    amiType: summary.AmiType || '',
    amiVersion: semver.valid(summary.AmiVersion) || '0.0.0',
  };
}

function isStable(ec2Image) {
  let hasStableTag = ec2Image.Tags && ec2Image.Tags.some(t => t.Key.toLowerCase() === 'stable' && t.Value !== '');
  let hasStableInDescription = ec2Image.Description && ec2Image.Description.toLowerCase() === 'stable';
  return !!((hasStableTag || hasStableInDescription));
}
