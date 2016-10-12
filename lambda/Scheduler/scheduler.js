'use strict';

const co = require('co');
const _ = require('lodash');

const ec2 = require('./services/aws').ec2;
const emFactory = require('./services/em');

const scheduling = require('./scheduling');
const reporting = require('./presentation/reporting');

function createScheduler(config) {

  let em = emFactory.create(config.em);

  function doScheduling () {
    return co(function*() {

      let instances = yield getInstancesWithEnvironments(config.limitToEnvironment);

      let scheduledActions = scheduledActionsForInstances(instances);
      let actionGroups = groupActionsByType(scheduledActions);

      let changeResults = yield performChanges(actionGroups);

      return reporting.createReport({ actionGroups, changeResults }, config.listSkippedInstances);

    }).catch(err => {

      return {
        success: false,
        error: printableError(err),
      };

    });
  }

  function printableError(err) {
    if (err instanceof Error) {
      return {
        message: err.message,
        stack: err.stack
      };
    }

    return err;
  }

  function getInstancesWithEnvironments(environmentFilter) {

    return Promise.all([ec2.getAllInstances(), em.getAllEnvironments()]).then(data => {

      let allInstances = data[0];
      let environments = buildEnvironmentIndex(data[1]);

      let instances = [];

      allInstances.forEach(instance => {
        let environmentName = getInstanceTagValue(instance, 'environment');

        if (environmentMatchesFilter(environmentName, environmentFilter)) {
          instance.Environment = findEnvironmentByName(environments, environmentName);
          instances.push(instance);
        }
      });

      return instances;

    });

  }

  function environmentMatchesFilter(environmentName, environmentFilter) {

    if (!environmentFilter) return true;
    if (!environmentName) return false;

    var re = new RegExp(environmentFilter);
    return re.test(environmentName);

  }

  function buildEnvironmentIndex(environmentData) {

    let environments = {};

    environmentData.forEach(env => {
      let environment = env.Value;
      environment.Name = env.EnvironmentName;
      environments[env.EnvironmentName] = environment;
    });

    return environments;

  }

  function findEnvironmentByName(environments, name) {
    if (name) return environments[name];
  }

  function getInstanceTagValue(instance, tagName) {
    let tag = _.first(instance.Tags.filter(tag => tag.Key.toLowerCase() == tagName.toLowerCase()));
    if (tag) return tag.Value;
  }

  function scheduledActionsForInstances(instances) {

    let dateTime = new Date();

    return instances.map(instance => {
      let action = scheduling.actionForInstance(instance, dateTime);
      return { action, instance };
    });

  }

  function groupActionsByType(instanceActions) {

    let result = {};
    Object.keys(scheduling.actions).forEach(action => result[action] = []);

    instanceActions.forEach(instanceAction => {
      result[instanceAction.action.action].push(instanceAction);
    });

    return result;

  }

  function performChanges(actionGroups) {
    return co(function*() {
    
      return {
        switchOn: yield performChange(ec2.switchInstancesOn, actionGroups.switchOn, config.whatIf),
        switchOff: yield performChange(ec2.switchInstancesOff, actionGroups.switchOff, config.whatIf)
      };

    });
  }

  function performChange(doChange, actions, whatIf) {

    if (!actions.length || whatIf) {
      return Promise.resolve({ success: true });
    }

    let instances = actions.map(action => action.instance.InstanceId);

    return doChange(instances)
      .then(() => { return { success: true }; })
      .catch(err => { return { success: false, error: err }; });

  }

  return { doScheduling };

}

module.exports = {
  create: createScheduler
};