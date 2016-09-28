var UnmanagedErrorAnomaly = require('../anomalies/UnmanagedErrorAnomaly.js'),
    Enums                 = require('../Enums.js'),
    assert                = require('assert');
/**
 * This services scans the "InfraOpsEnvironment" DynamoDB table and provides a
 * dictionary of EnvironmentName/DefaultSchedule.
 *
 * @param {DynamoTableProvider} dynamoTableProvider
 */
function EnvironmentsScheduleProvider(dynamoTableProvider, anomaliesCollector) {

  assert(dynamoTableProvider, "Missing 'dynamoTableProvider' argument.");
  assert(anomaliesCollector, "Missing 'anomaliesCollector' argument.");

  var self = this;

  var getScheduleValue = function (name, value) {

    if (value.ScheduleAutomatically === false) {
      if (value.ManualScheduleUp === true) return Enums.FIXED_SCHEDULE.AlwaysOn;
      if (value.ManualScheduleUp === false) return Enums.FIXED_SCHEDULE.AlwaysOff;

      var anomalyMessage = "Environment '" + name + "' is manually scheduled but the state to apply has not been defined";
      anomaliesCollector.add(new UnmanagedErrorAnomaly(anomalyMessage));
      return null;
    }

    return value.DefaultSchedule || null;

  }

  self.get = function (callback) {

    dynamoTableProvider.scanTable("InfraOpsEnvironment", function (error, environments) {

      if (error) { callback(error); return; }

      var environmentSchedules = {};

      environments.forEach(function (environment) {

        var environmentName = environment.EnvironmentName.toLowerCase();
        environmentSchedules[environmentName] = getScheduleValue(environmentName, environment.Value);

      });

      callback(null, environmentSchedules);

    });

  };

}

module.exports = EnvironmentsScheduleProvider;
