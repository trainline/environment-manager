/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').factory('Image',
  function ($q, awsService, resources) {
    function Image(data) {
      _.assign(this, data);
    }

    Image.getByName = function (name) {
      var amiName = name;
      var amiVersion = awsService.images.GetAmiVersionFromName(amiName);
      var amiType = awsService.images.GetAmiTypeFromName(amiName);

      return awsService.images.GetImageDetails().then(function (images) {
        var ami = awsService.images.GetAmiByTypeAndVersion(amiType, amiVersion, images);
        if (ami === null) {
          ami = awsService.images.GetLatestAmiVersionByType(amiType, images, true);
        }
        return ami;
      });
    };

    _.assign(Image.prototype, {

    });

    return Image;
  });

