/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let express = require('express');
let router = express.Router();
let consulClient = require('modules/consul-client');
let assert = require('assert');

router.post('/:environment', (req, res) => {
  Promise.resolve()
    .then(() => {
      assert(req.body.hosts);

      let environment = req.params.environment;
      let hosts = req.body.hosts;

      let clientInstance; 

      return consulClient.create({ environment, promisify: true})
        .then((newClientInstance) => {
          console.log('*************************************************')
          console.log('*************************************************')
          console.log('*************************************************')
          console.log('*************************************************')
          clientInstance = newClientInstance;
          return clientInstance.catalog.service.list()
        })
        .then(console.log)
        .then(() => {
          clientInstance.catalog.node.list()
            .then(console.log)
        });


      consulClient.create({ environment, promisify: true })
        .then((clientInstance) => {
          return clientInstance.catalog.node.list();
        })
        .then(value => { 
          return res.json(req.body.hosts.map(x => x + '44444')) })
    })
    .catch(e => {
      res.status(400).json({ error: '`Hosts` is a required value in the body of this request.' });
    });
});

module.exports = {
  router
};
