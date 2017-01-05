/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var assert = require('assert');

module.exports = function Image(imageSummary) {

  assert(imageSummary, 'Expected "ami" argument not to be null.');

  this.id = imageSummary.ImageId;
  this.creationDate = imageSummary.CreationDate;
  this.platform = imageSummary.Platform;
  this.name = imageSummary.Name;
  this.description = imageSummary.Description;
  this.type = imageSummary.AmiType;
  this.version = imageSummary.AmiVersion;
  this.isCompatibleImage = imageSummary.IsCompatibleImage;
  this.encrypted = imageSummary.Encrypted;
  this.isStable = imageSummary.IsStable;
  this.rootVolumeSize = imageSummary.RootVolumeSize;
};
