/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

Date.prototype.getDaysBetweenDates = function (date2) {
  var diff = this.getTime() - new Date(date2).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

Array.prototype.merge = function (targets, comparer, builder) {
  return this.map(function (source) {
    var target = targets.filter(function (x) { return comparer(source, x); })[0];
    return builder(source, target);
  });
};
