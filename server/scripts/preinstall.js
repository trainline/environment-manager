/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let fs = require('fs');
let path = require('path');

linkModules();

function linkModules() {
  let dir = 'modules';
  let target = path.join(__dirname, '..', dir);
  let link = path.join(__dirname, '..', 'node_modules', dir);

  let ln = (tgt, lnk, i) => {
    try {
      fs.symlinkSync(target, link, 'junction');
    } catch (error) {
      if (error.code === 'EEXIST' && 0 < i) {
        fs.unlinkSync(lnk);
        ln(tgt, lnk, i - 1);
      } else {
        throw error;
      }
    }
  };

  ln(target, link, 1);
}
