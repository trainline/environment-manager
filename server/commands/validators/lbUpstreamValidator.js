/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');

let valid = {
  isValid: true,
};

let invalid = (err) => {
  return {
    isValid: false,
    err,
  };
};

function validateDnsName(dnsName, isProd) {
  let consulMatch = /^[^\.]*?-[^\.]*$/.exec(dnsName);
  if (consulMatch) return valid;

  if (!_.includes(dnsName, '.')) {
    return invalid(`"${dnsName}" is not a valid as it contains no dots`);
  }

  let regex = /^([a-zA-Z0-9-]*?)\.(.*)$/;
  let matches = regex.exec(dnsName);

  if (!matches) {
    return invalid(`"${dnsName}" is not a valid as it contains illegal characters`);
  }

  let subDomain = matches[1];
  let tld = matches[2];

  if (subDomain.startsWith('-') || subDomain.endsWith('-')) {
    return invalid(`"${dnsName}" is not valid as sub domains must not begin or end with a hyphen`);
  }

  let hyphensCount = (subDomain.match(/-/g) || []).length;
  if (hyphensCount > 3) return invalid(`"${dnsName}" is not valid as sub domains must not contain more than 3 hyphens`);

  return valid;
}

function validatePort(port, service) {
  if (port && service.Value.BluePort && service.Value.GreenPort) {
    if (port != service.Value.BluePort && port != service.Value.GreenPort) {
      let err = `Host port ${port} does not match blue or green port of ${service.ServiceName}`;
      return invalid(err);
    }
  }

  return valid;
}

exports.validate = (upstream, account, services) => {
  let hosts = upstream.Value.Hosts;

  if (hosts) {
    for (let host of hosts) {
      let dnsCheck = validateDnsName(host.DnsName, account.IsProd);
      if (!dnsCheck.isValid) {
        return dnsCheck;
      }

      if (services && services.length === 1) {
        let portCheck = validatePort(host.Port, services[0]);
        if (!portCheck.isValid) {
          return portCheck;
        }
      }
    }
  }

  return valid;
};
