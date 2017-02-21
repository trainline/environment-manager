/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let sender = require('modules/sender');
let Image = require('modules/provisioning/Image.class');
let ImageNotFoundError = require('modules/errors/ImageNotFoundError.class');

module.exports = {

  get(imageIdNameOrType, includeUnstable) {
    assert(imageIdNameOrType, 'Expected "imageIdNameOrType" argument not to be null');
    if (imageIdNameOrType.toLowerCase().startsWith('ami')) {
      return getImage({ id: imageIdNameOrType });
    }
    else if (doesSpecifyVersion(imageIdNameOrType)) {
      return getImage({ name: imageIdNameOrType });
    } else {
      let safeIncludeUnstable = includeUnstable === undefined ? false : includeUnstable;
      return getLatestImageByType(imageIdNameOrType, safeIncludeUnstable);
    }
  }
};

function doesSpecifyVersion(imageIdNameOrType) {
  return imageIdNameOrType.match(/\-(\d+\.){2}\d+$/);
}

function getImage(params) {
  let filter = {};

  if (params.id) filter['image-id'] = params.id;
  if (params.name) filter['name'] = params.name;

  let query = { name: 'ScanCrossAccountImages', filter };

  return sender
    .sendQuery({ query })
    .then(amiImages =>
      (amiImages.length ?
        Promise.resolve(new Image(amiImages[0])) :
        Promise.reject(new ImageNotFoundError(`No AMI image "${params.id || params.name}" found.`))
      )
    );
}

function getLatestImageByType(imageType, includeUnstable) {
  let query = {
    name: 'ScanCrossAccountImages'
  };

  return sender
    .sendQuery({ query })
    .then((amiImages) => {
      let isLatest = includeUnstable ? image => image.IsLatest : image => image.IsLatestStable;
      let latestImage = amiImages.find(image => image.AmiType === imageType && isLatest(image));

      if (latestImage) {
        return new Image(latestImage);
      }

      throw new ImageNotFoundError(`No AMI image of type "${imageType}" found.`);
    });
}
