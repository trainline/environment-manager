/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = (topicsToReplicate) => {
  return (doThis) => {
    const topics = topicsToReplicate.split('_');
    let promises = [];

    topics.reduce((acc, val) => {
      promises.push(doThis(acc + val));
      return acc + val;
    }, '');

    return Promise.all(promises);
  };
};
