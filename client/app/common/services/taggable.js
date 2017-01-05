/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .factory('taggable', function() {

    return function(cls) {
      cls.prototype.getTag = function (key) {
        var tag = _.find(this.Tags, { Key: key });
        if (tag === undefined) {
          throw new Error("Can't find tag");
        }
        return tag.Value;
      }

      cls.prototype.setTag = function (key, value) {
        var tag = this.getTag(key);
        if (tag === undefined) {
          tag = {
            Key: key,
            Value: value,
          };
          this.Tags.push(tag);
        } else {
          tag.Value = value;
        }
      }
    };

  });
