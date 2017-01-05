/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let http = require('http');

function HttpServerFactory() {
  this.create = function (application, parameters) {
    return new Promise((resolve) => {
      let port = parameters.port;
      let server = http.createServer(application);
      server.listen(port, () => resolve(server));
    });
  };
}

module.exports = HttpServerFactory;
