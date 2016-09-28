var MismatchingAutoScalingGroupScheduleAnomaly  = require('../anomalies/MismatchingAutoScalingGroupScheduleAnomaly.js'),
    MismatchingAutoScalingGroupStateAnomaly     = require('../anomalies/MismatchingAutoScalingGroupStateAnomaly.js'),
    MismatchingAutoScalingGroupLifecycleAnomaly = require('../anomalies/MismatchingAutoScalingGroupLifecycleAnomaly.js'),
    MissingInstanceAnomaly                      = require('../anomalies/MissingInstanceAnomaly.js'),
    MissingInstanceEnvironmentTagAnomaly        = require('../anomalies/MissingInstanceEnvironmentTagAnomaly.js'),
    UnknownInstanceEnvironmentTagAnomaly        = require('../anomalies/UnknownInstanceEnvironmentTagAnomaly.js'),
    InstanceSchedule                            = require('../contracts/InstanceSchedule.js'),
    AutoScalingGroupSchedule                    = require('../contracts/AutoScalingGroupSchedule.js'),
    IT                                          = require('../helpers/IT.js'),
    Enums                                       = require('../Enums.js'),
    assert                                      = require('assert');



/**
 * This class creates a list of AutoScalingGroupSchedule from EC2 instances and AutoScalingGroup existing in the
 * current AWS account.
 *
 * @param {AutoScalingGroupsService}     autoScalingGroupsService
 * @param {EC2InstancesService}          ec2InstancesService
 * @param {EnvironmentSchedulesProvider} environmentSchedulesProvider
 * @param {AnomaliesCollector}           anomaliesCollector
 */
function AutoScalingGroupSchedulesProvider(autoScalingGroupsService, ec2InstancesService, environmentSchedulesProvider, asyncronizer, anomaliesCollector) {
  
  assert(autoScalingGroupsService, "Missing 'autoScalingGroupsService' argument.");
  assert(ec2InstancesService, "Missing 'ec2InstancesService' argument.");
  assert(environmentSchedulesProvider, "Missing 'environmentSchedulesProvider' argument.");
  assert(asyncronizer, "Missing 'asyncronizer' argument.");
  assert(anomaliesCollector, "Missing 'anomaliesCollector' argument.");
  
  
  var self = this;
  
  /**
   * Return true when instances in the AutoScalingGroup have different schedule value.
   * 
   * @param   {AutoScalingGroupSchedule} autoScalingGroupSchedule 
   * @returns {Boolean} 
   */
  function isAutoScalingGroupScheduleMismatching(autoScalingGroupSchedule) {
    
    var instancesSchedule = autoScalingGroupSchedule.Instances.map(function (instance) {
      return instance.Schedule.Value;
    });
    
    var isMismatching = instancesSchedule.some(function (schedule) {
      return instancesSchedule.indexOf(schedule) !== 0;
    });
    
    if (isMismatching) {
      var anomaly = new MismatchingAutoScalingGroupScheduleAnomaly(autoScalingGroupSchedule.Name, instancesSchedule);
      anomaliesCollector.add(anomaly);
    }
    
    return isMismatching;

  }
  
  /**
   * Return true when instances in the AutoScalingGroup are in a status that means the
   * AutoScalingGroup is changing.
   * For instance: AWS is scaling it out because an unhealthy instance has been found.
   * 
   * @param   {AutoScalingGroupSchedule} autoScalingGroupSchedule 
   * @returns {Boolean} 
   */
  function isAutoScalingGroupChanging(autoScalingGroupSchedule) {
    
    var isChanging = autoScalingGroupSchedule.Instances.some(function (instance) {
      if (Enums.MANAGED_INSTANCE_STATES.indexOf(instance.State)         < 0) return true;
      if (Enums.MANAGED_INSTANCE_LIFECYCLES.indexOf(instance.Lifecycle) < 0) return true;
      
      return false;
    });
    
    return isChanging;
  }
  
  /**
   * Return true when instances in the AutoScalingGroup are not all 'running' or all 'stopped'
   * 
   * @param   {AutoScalingGroupSchedule} autoScalingGroupSchedule 
   * @returns {Boolean} 
   */
  function isAutoScalingGroupStateMismatching(autoScalingGroupSchedule) {
    
    var instancesState = autoScalingGroupSchedule.Instances.map(function (instance) {
      return instance.State;
    });
    
    var isMismatching = instancesState.some(function (state) {
      return instancesState.indexOf(state) !== 0;
    });
    
    if (isMismatching) {
      var anomaly = new MismatchingAutoScalingGroupStateAnomaly(autoScalingGroupSchedule.Name, instancesState);
      anomaliesCollector.add(anomaly);
    }
    
    return isMismatching;

  }
  
  /**
   * Return true when instances in the AutoScalingGroup are not all 'Standby' or all 'InService'
   * 
   * @param   {AutoScalingGroupSchedule} autoScalingGroupSchedule 
   * @returns {Boolean} 
   */
  function isAutoScalingGroupLifecycleMismatching(autoScalingGroupSchedule) {
    
    var instancesLifecycle = autoScalingGroupSchedule.Instances.map(function (instance) {
      return instance.Lifecycle;
    });
    
    var isMismatching = instancesLifecycle.some(function (lifecycle) {
      return instancesLifecycle.indexOf(lifecycle) !== 0;
    });
    
    if (isMismatching) {
      var anomaly = new MismatchingAutoScalingGroupLifecycleAnomaly(autoScalingGroupSchedule.Name, instancesLifecycle);
      anomaliesCollector.add(anomaly);
    }
    
    return isMismatching;

  }
  
  function toAutoScalingGroupSchedules(groups, instances, defaultSchedules) {
    
    var result = [];
    
    function scheduleHasValue(value) {
      if (!value) return false;
      if (value.toLowerCase() === 'default') return false;
      
      return true;
    }
    
    groups.map(function (group) {
      
      function asInstanceSchedule(groupInstance) {
        
        var instance = instances.filter(function (instance) {
          return instance.Id === groupInstance.Id;
        })[0];
        
        if (!instance) {
          anomaliesCollector.add(new MissingInstanceAnomaly(group.Name, groupInstance.Id));
          return null;
        }
        
        var id = groupInstance.Id;
        var environment = instance.Environment;
        var lifecycle = groupInstance.Lifecycle;
        var state = instance.State;
        var environmentSchedule = defaultSchedules[environment];
        
        // Checking anomalies
        
        if (!instance.Environment) {
          anomaliesCollector.add(new MissingInstanceEnvironmentTagAnomaly(id));
        } else if (environmentSchedule === undefined) {
          anomaliesCollector.add(new UnknownInstanceEnvironmentTagAnomaly(id, environment));
        }
        
        if (scheduleHasValue(instance.Schedule)) {
          return new InstanceSchedule(id, state, lifecycle, instance.Schedule, Enums.SCHEDULE_SOURCE.Instance);
        }
        
        if (scheduleHasValue(group.Schedule)) {
          return new InstanceSchedule(id, state, lifecycle, group.Schedule, Enums.SCHEDULE_SOURCE.AutoScalingGroup);
        }
        
        if (scheduleHasValue(environmentSchedule)) {
          return new InstanceSchedule(id, state, lifecycle, environmentSchedule, Enums.SCHEDULE_SOURCE.Environment);
        }
        
        return new InstanceSchedule(id, state, lifecycle, Enums.DEFAULT_SCHEDULE, Enums.SCHEDULE_SOURCE.Default);
      }
      
      var instancesSchedule = group.Instances.map(asInstanceSchedule).filter(IT.exists);
      if (!instancesSchedule.length) {
        console.log("AutoScalingGroup '%s' skipped because does not contain any instance", group.Name);
        return;
      }
      
      var autoScalingGroupSchedule = new AutoScalingGroupSchedule(group.Name, group.Size, instancesSchedule);
      
      if (isAutoScalingGroupChanging(autoScalingGroupSchedule)) {
        console.log("AutoScalingGroup '%s' skipped because it is changing", group.Name);
        return;
      }
      
      if (isAutoScalingGroupScheduleMismatching(autoScalingGroupSchedule)) {
        console.log("AutoScalingGroup '%s' skipped because its instances have mismatching schedule", group.Name);
        return;
      }
      
      if (isAutoScalingGroupStateMismatching(autoScalingGroupSchedule)) {
        console.log("AutoScalingGroup '%s' skipped because its instances have mismatching state", group.Name);
        return;
      }
      
      if (isAutoScalingGroupLifecycleMismatching(autoScalingGroupSchedule)) {
        console.log("AutoScalingGroup '%s' skipped because its instances have mismatching lifecycle", group.Name);
        return;
      }
      
      result.push(autoScalingGroupSchedule);

    });
    
    return result;

  }
  
  self.getSchedules = function (mainCallback) {
    
    var defaultSchedules = null;
    var instances = null;
    var groups = null;
    
    asyncronizer.parallelizeTasks([

      function (callback) {
        environmentSchedulesProvider.get(function (error, result) {
          defaultSchedules = result;
          callback(error);
        });
      },

      function (callback) {
        ec2InstancesService.getInstances(function (error, result) {
          instances = result;
          callback(error);
        });
      },

      function (callback) {
        autoScalingGroupsService.getGroups(function (error, result) {
          groups = result;
          callback(error);
        });
      }
    ],
    
    function (error) {
      
      if (error) {
        mainCallback(error);
      } else {
        var autoScalingGroupsSchedule = toAutoScalingGroupSchedules(groups, instances, defaultSchedules);
        mainCallback(null, autoScalingGroupsSchedule);
      }

    });

  };

}

module.exports = AutoScalingGroupSchedulesProvider;