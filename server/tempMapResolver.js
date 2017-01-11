/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let fs = require('fs');

function createMap(directory) {
  let obj = {};

  // eslint-disable-next-line array-callback-return
  fs.readdirSync(directory).filter((file) => {
    let pattern = new RegExp('(.*).js$');
    let match = file.match(pattern);
    if (match !== null) {
      obj[match[1]] = require(`${directory}/${file}`);
    }
  });

  return obj;
}

let all = Object.assign(
  createMap('./queryHandlers'),
  createMap('./queryHandlers/services'),
  createMap('./queryHandlers/deployments'),
  createMap('./queryHandlers/slices'),

  createMap('./commands/asg'),
  createMap('./commands/aws'),
  createMap('./commands/deployments'),
  createMap('./commands/launch-config'),
  createMap('./commands/resources'),
  createMap('./commands/services'),
  createMap('./commands/slices'),
  createMap('./commands/validators')
);

module.exports = {
  all,
};
