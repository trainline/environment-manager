var UnmanagedErrorAnomaly = require('../anomalies/UnmanagedErrorAnomaly.js'),
    assert                = require('assert');

/**
 * This service gets a list of AutoScalingGroupSchedules and for each one calls the toggler service.
 *
 * @param {AutoScalingGroupSchedulesProvider} autoScalingGroupSchedulesProvider
 * @param {AutoScalingGroupToggler}           autoScalingGroupToggler
 * @param {Asyncronizer}                      asyncronizer
 */
function GovernatorService(autoScalingGroupSchedulesProvider, autoScalingGroupToggler, asyncronizer, anomaliesCollector) {

  assert(autoScalingGroupSchedulesProvider, "Missing 'autoScalingGroupSchedulesProvider' argument.");
  assert(autoScalingGroupToggler, "Missing 'autoScalingGroupToggler' argument.");
  assert(asyncronizer, "Missing 'asyncronizer' argument.");
  assert(anomaliesCollector, "Missing 'anomaliesCollector' argument.");

  var self = this;

  self.govern = function (callback) {

    autoScalingGroupSchedulesProvider.getSchedules(function (error, autoScalingGroups) {

      if (error) { callback(error); return; }

      function autoScalingGroupAsTogglerTask(autoScalingGroup) {
        return function (callback) {
          autoScalingGroupToggler.toggle(autoScalingGroup, callback);
        };
      }

      var tasks = autoScalingGroups.map(autoScalingGroupAsTogglerTask);

      console.log(tasks.length + " AutoScalingGroups found to manage.");

      asyncronizer.parallelizeTasks(tasks, function (error) {

        if (error) {
          anomaliesCollector.add(new UnmanagedErrorAnomaly(error.message));
        }

        var anomalies = anomaliesCollector.all();
        callback(anomalies);

      });

    });

  };
}

module.exports = GovernatorService;
