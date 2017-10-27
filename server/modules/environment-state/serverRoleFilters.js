'use strict';

let { ServiceAction: { INSTALL } } = require('../../Enums');
let { format } = require('../serviceName');
let fp = require('lodash/fp');

function createServerRoleFilter({ serviceName, slice, serverRole }) {
  if (!serviceName) {
    return () => true;
  }

  let slicePredicate = slice ? x => x === slice : () => true;
  let servicePredicate = ({ Action, Name, Slice }) =>
    (Name === serviceName)
    && slicePredicate(Slice)
    && (Action === undefined || Action === INSTALL);
  let serverRoleNamePredicate = serverRole
    ? x => new RegExp(`^${serverRole}((-blue)|(-green))?$`).test(x)
    : () => true;

  return ({ Role, Services }) => serverRoleNamePredicate(Role) && fp.some(servicePredicate)(Services);
}

function describeServerRoleFilter({ environmentName, serviceName, slice, serverRole }) {
  let print = fn => val => (val ? fn(val) : undefined);
  let sliceOf = print(x => `${x} slice of`);
  let service = print(x => `service ${x}`);
  let inEnvironment = print(x => `in environment ${x}`);
  let installedOn = print(x => `installed on server role ${x}`);
  return ['the', sliceOf(slice), service(serviceName), inEnvironment(environmentName), installedOn(serverRole)]
    .filter(x => x)
    .join(' ');
}

function fullyQualifiedServiceNamesFor({ environmentName, serviceName, slice, serverRole }) {
  let slices = slice ? [slice] : ['blue', 'green', 'none'];
  return fp.map(format.bind(null, environmentName, serviceName))(slices);
}

module.exports = {
  createServerRoleFilter,
  describeServerRoleFilter,
  fullyQualifiedServiceNamesFor
};
