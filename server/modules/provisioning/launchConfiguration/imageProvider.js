/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let sender = require('modules/sender');
let Image = require('modules/provisioning/Image.class');
let ImageNotFoundError = require('modules/errors/ImageNotFoundError.class');

module.exports = {

  get(imageNameOrType, includeUnstable) {
    assert(imageNameOrType, 'Expected "imageNameOrType" argument not to be null');
    if (doesSpecifyVersion(imageNameOrType)) {
      return getImageByName(imageNameOrType);
    } else {
      let safeIncludeUnstable = includeUnstable === undefined ? false : includeUnstable;
      return getLatestImageByType(imageNameOrType, safeIncludeUnstable);
    }
  },
};

function doesSpecifyVersion(imageNameOrType) {
  return imageNameOrType.match(/\-(\d+\.){2}\d+$/);
}

function getImageByName(imageName) {
  let query = {
    name: 'ScanCrossAccountImages',
    filter: {
      name: imageName,
    },
  };

  return sender
    .sendQuery({ query })
    .then(amiImages =>
      (amiImages.length ?
        Promise.resolve(new Image(amiImages[0])) :
        Promise.reject(new ImageNotFoundError(`No AMI image named "${imageName}" found.`))
      )
    );
}

function getLatestImageByType(imageType, includeUnstable) {
  let query = {
    name: 'ScanCrossAccountImages',
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
