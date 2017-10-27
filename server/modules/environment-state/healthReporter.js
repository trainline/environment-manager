'use strict';

let Promise = require('bluebird');

let {
  assign,
  defaultTo,
  every,
  filter,
  find,
  flatMap,
  flow,
  fromPairs,
  get,
  groupBy,
  omitBy,
  map,
  mapValues,
  max,
  reduce,
  size,
  sumBy,
  toPairs,
  uniq
} = require('lodash/fp');
let { valueOfTag } = require('../consulDataStructures');
let serviceName = require('../serviceName');

let valueOfAwsTag = key => flow(get('Tags'), find(tag => tag.Key === key), get('Value'));

function desiredTopologyOf(getServerRolesResult) {
  let environment = getServerRolesResult.EnvironmentName;
  let fullyQualifiedServiceNameOf = serviceName.format.bind(null, environment);
  return flow(
    get('Value'),
    flatMap(({ Role, Services }) => map(({ Name, Slice }) => ([
      fullyQualifiedServiceNameOf(Name, Slice),
      { environment, role: Role, service: Name, slice: Slice }
    ]))(Services)),
    groupBy(([fullyQualifiedServiceName]) => fullyQualifiedServiceName),
    mapValues(reduce((acc, [, { environment: env, role, service, slice }]) => ({
      environment: env,
      roles: [...acc.roles, role],
      service,
      slice
    }), { roles: [] }))
  )(getServerRolesResult);
}

function instancesOf(describeInstancesResult) {
  let autoScalingGroupOf = valueOfAwsTag('aws:autoscaling:groupName');
  let nameOf = valueOfAwsTag('Name');
  let roleOf = valueOfAwsTag('Role');
  return flow(
    get('Reservations'),
    flatMap(get('Instances')),
    map(instance => [nameOf(instance), { role: roleOf(instance), autoScalingGroup: autoScalingGroupOf(instance) }]),
    fromPairs
  )(describeInstancesResult);
}

function instancesRequestFor(getAwsAccountForEnvironment, serviceHealthResults) {
  let environmentOf = valueOfTag('environment');
  let getEnvironments = flow(
    flatMap(({ Service, Node: { Node } }) => environmentOf(Service)),
    uniq);

  let getEnvAccountMapper = environments => Promise.map(environments, e => getAwsAccountForEnvironment(e).then(a => [e, a]))
    .then(flow(fromPairs, envAccountMap => env => envAccountMap[env]));

  let groupByAccount = (accountFor, health) => flow(
    flatMap(({ Service, Node: { Node } }) =>
      environmentOf(Service).map(env => [accountFor(env), Node])),
    groupBy(([key]) => key),
    mapValues(flow(map(([, value]) => value), uniq))
  )(health);

  return Promise.resolve(serviceHealthResults)
    .then(getEnvironments)
    .then(getEnvAccountMapper)
    .then(accountFor => groupByAccount(accountFor, serviceHealthResults));
}

function desiredState(desiredTopology, desiredCounts) {
  let sizeOf = (environment, role) => flow(
    get([environment, role, 'desiredCount']),
    defaultTo(0));
  let environmentOf = fullyQualifiedServiceName => fullyQualifiedServiceName.split('-')[0];

  let rolesWithSize = environmentName => flow(
    get('roles'),
    map(role => [role, { desiredCount: sizeOf(environmentName, role)(desiredCounts) }]),
    fromPairs
  );

  return flow(
    toPairs,
    map(([fullyQualifiedServiceName, value]) => [
      fullyQualifiedServiceName,
      assign(value)({ roles: rolesWithSize(environmentOf(fullyQualifiedServiceName))(value) })
    ]),
    fromPairs
  )(desiredTopology);
}

function desiredCountOf(autoScalingGroups) {
  let environmentOf = valueOfAwsTag('Environment');
  let roleOf = valueOfAwsTag('Role');
  return flow(
    map(autoScalingGroup => ({
      environment: environmentOf(autoScalingGroup),
      role: roleOf(autoScalingGroup),
      desiredCount: get('DesiredCapacity')(autoScalingGroup)
    })),
    groupBy(get('environment')),
    mapValues(flow(
      groupBy(get('role')),
      mapValues(flow(
        sumBy(get('desiredCount')),
        desiredCount => ({ desiredCount })
      ))
    ))
  )(autoScalingGroups);
}

function currentState(health, instances) {
  let summarizeHealthChecks = every(({ Status }) => Status === 'passing');
  let summarizeServiceHealthByRole = (acc, node) => {
    let add = (left, right) => ({
      'failing-checks': [...(left['failing-checks'] || []), ...filter(check => check.Status !== 'passing')(right['failing-checks'])],
      healthyCount: (left.healthyCount || 0) + right.healthyCount,
      unhealthyCount: (left.unhealthyCount || 0) + right.unhealthyCount
    });
    let myhealth = {
      'failing-checks': node.Checks,
      healthyCount: node.Healthy ? 1 : 0,
      unhealthyCount: node.Healthy ? 0 : 1
    };
    if (node.Role) {
      if (!acc.roles) {
        acc.roles = {};
      }
      acc.roles[node.Role] = add(acc.roles[node.Role] || {}, myhealth);
    } else {
      if (!acc.instances) {
        acc.instances = {};
      }
      acc.instances[node.Node] = add(acc.instances[node.Node] || {}, myhealth);
    }
    return acc;
  };

  return flow(
    map(({ Node: { Node }, Service: { Service }, Checks }) => ({
      AutoScalingGroup: get([Node, 'autoScalingGroup'])(instances),
      Checks,
      Healthy: summarizeHealthChecks(Checks),
      Node,
      Role: get([Node, 'role'])(instances),
      Service
    })),
    groupBy(({ Service }) => Service),
    mapValues(serviceNodes => reduce(summarizeServiceHealthByRole, {})(serviceNodes))
  )(health);
}

function compare(desired, current) {
  let flat = flow(
    toPairs,
    flatMap(([key, value]) => {
      let withContext = v => flow(
        assign({
          environment: value.environment,
          service: value.service,
          slice: value.slice
        }),
        assign(v)
      );
      let roles = map(([k, v]) => [key, withContext(v)({ role: k })])(toPairs(value.roles));
      let instances = map(([k, v]) => [key, withContext(v)({ instance: k })])(toPairs(value.instances));
      return [...roles, ...instances];
    })
  );

  let aggregate = query => (left, right) => flow(
    toPairs,
    map(([key, fn]) => [key, fn(left[key], right[key])]),
    fromPairs
  )(query);
  let sum = (x, y) => (x || 0) + (y || 0);
  let cat = (x, y) => [...(x || []), ...(y || [])];

  let states = [...flat(desired), ...flat(current)];

  return flow(
    groupBy(([key]) => key),
    mapValues(flow(
      map(([, value]) => value),
      values => ({
        environment: flow(map(get('environment')), max)(values),
        'orphanedInstances': flow(
          filter(({ instance }) => instance !== undefined),
          groupBy(({ instance }) => instance),
          mapValues(reduce(aggregate({ 'failing-checks': cat, healthyCount: sum, unhealthyCount: sum }), {})),
          toPairs,
          map(([k, v]) => assign(v)({ name: k }))
        )(values),
        roles: flow(
          filter(({ role }) => role !== undefined),
          groupBy(({ role }) => role),
          mapValues(reduce(aggregate({ 'failing-checks': cat, healthyCount: sum, desiredCount: sum, unhealthyCount: sum }), {})),
          toPairs,
          map(([k, v]) => assign(v)({ name: k }))
        )(values),
        service: flow(map(get('service')), max)(values),
        slice: flow(map(get('slice')), max)(values)
      }),
      omitBy(x => x === undefined))),
    toPairs,
    map(([k, v]) => assign({ name: k })(v))
  )(states);
}

function summariseComparison(service) {
  let desiredTotals = flow(
    get('roles'),
    reduce(([desiredN, healthyN], { desiredCount, healthyCount }) => [
      desiredN + desiredCount,
      healthyN + (desiredCount > 0 ? healthyCount : 0)
    ], [0, 0])
  );

  let overCapacity = flow(
    get('roles'),
    filter(role => role.desiredCount === 0),
    reduce((n, { healthyCount, unhealthyCount }) => n + healthyCount + unhealthyCount, 0)
  );

  let orphaned = flow(
    get('orphanedInstances'),
    size
  );

  let [desiredN, desiredHealthyN] = desiredTotals(service);

  return {
    desiredCount: desiredN,
    desiredAndHealthyCount: desiredHealthyN,
    undesiredCount: overCapacity(service) + orphaned(service)
  };
}

module.exports = {
  compare,
  currentState,
  desiredState,
  desiredTopologyOf,
  desiredCountOf,
  instancesOf,
  instancesRequestFor,
  summariseComparison
};
