'use strict';

let request = require('request-promise').defaults({ strictSSL: false });
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

function getHosts(accountName, environmentName) {
  let uri = `${buildUri(accountName, environmentName)}/host`;
  return request(uri)
    .then(data => JSON.parse(data));
}

function getHostByInstanceId(instanceId) {
  return request(`${monitorUri}/host/${instanceId}`)
    .then(data => JSON.parse(data));
}

function getHostGroups(accountName, environmentName) {
  let uri = `${buildUri(accountName, environmentName)}/host-group`;
  return request(uri)
    .then(data => JSON.parse(data));
}

function getHostGroupByName(hostGroupName) {
  return request(`${monitorUri}/host-group/${hostGroupName}`)
    .then(data => JSON.parse(data));
}

function getImages(accountName) {
  let uri = accountName ? `${monitorUri}/account/${accountName}/image` : `${monitorUri}/image`;
  return request(uri)
    .then(data => JSON.parse(data));
}

module.exports = {
  getHosts,
  getHostByInstanceId,
  getHostGroups,
  getHostGroupByName,
  getImages
};
