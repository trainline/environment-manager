/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

function SinonHelper() {

  this.getCalls = function (spy) {

    var calls = [];
    var call  = null;
    var index = 0;

    while (!!(call = spy.getCall(index))) {

      calls.push(call);
      index++;

    }

    return calls;

  };

}

module.exports = new SinonHelper();
