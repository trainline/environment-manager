'use strict';

// For TLS rejection(not the greatest):
// cmd> set NODE_TLS_REJECT_UNAUTHORIZED=0

let request = require('request');
let config = require('../../config');

let monitorUri = `${config.getUserValue('local').emEc2Url}/api`;

function buildUri(accountName, environmentName) {
  let uri = `${monitorUri}`;
  if (accountName && !environmentName) {
    uri = `${monitorUri}/account/${accountName}`;
  }
  if (!accountName && environmentName) {
    uri = `${monitorUri}/environment/${environmentName}`;
  }
  if (accountName && environmentName) {
    uri = `${monitorUri}/account/${accountName}/${environmentName}`;
  }
  return uri;
}

function getHosts(onComplete, accountName, environmentName) {
  let uri = `${buildUri(accountName, environmentName)}/host`;
  request(uri, (err, res, body) => {
    onComplete(err, JSON.parse(body));
  });
}

function getHostByInstanceId(onComplete, instanceId) {
  request(`${monitorUri}/host/${instanceId}`, (err, res, body) => {
    onComplete(err, JSON.parse(body));
  });
}

function getHostGroups(onComplete, accountName, environmentName) {
  let uri = `${buildUri(accountName, environmentName)}/host-group`;
  request(uri, (err, res, body) => {
    onComplete(err, JSON.parse(body));
  });
}

function getHostGroupByName(hostGroupName, onComplete) {
  request(`${monitorUri}/host-group/${hostGroupName}`, (err, res, body) => {
    onComplete(err, JSON.parse(body));
  });
}

function getImages(onComplete, accountName) {
  let uri = accountName ? `${monitorUri}/account/${accountName}/image` : `${monitorUri}/image`;
  request(uri, (err, res, body) => {
    onComplete(err, JSON.parse(body));
  });
}

module.exports = {
  getHosts,
  getHostByInstanceId,
  getHostGroups,
  getHostGroupByName,
  getImages
};

// Manual testing

// getHostsByEnvironment('c50', (e, r) => { console.log(r); });
// getHosts((e, r) => { console.log(r); });
// getHostByInstanceId('i-0c80447ec4c7d3d49', (e, r) => console.log(r));
// getHostGroupsByEnvironment('c50', (e, r) => { console.log(r); });
// getHostGroups((e, r) => console.log(r));
// getHostGroupByName('st1-bo-MobileApi01', (e, r) => console.log(r));
// getImages((e, r) => { console.log(r); });
