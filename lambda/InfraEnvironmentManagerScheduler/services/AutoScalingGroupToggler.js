var EnteringInstancesToStandbyAnomaly  = require('../anomalies/EnteringInstancesToStandbyAnomaly.js'),
    StoppingInstancesAnomaly           = require('../anomalies/StoppingInstancesAnomaly.js'),
    StartingInstancesAnomaly           = require('../anomalies/StartingInstancesAnomaly.js'),
    ExitingInstancesFromStandbyAnomaly = require('../anomalies/ExitingInstancesFromStandbyAnomaly.js'),
    InvalidScheduleAnomaly             = require('../anomalies/InvalidScheduleAnomaly.js'),
    Enums                              = require('../Enums.js'),
    assert                             = require('assert');

/**
 * Analyzes an AutoScalingGroup and puts it OFF or ON considering the schedule assigned to its instances.
 *
 * @param {ScheduleInterpreter}         scheduleInterpreter
 * @param {AutoScalingGroupsService}    autoScalingGroupsService
 * @param {EC2InstancesService}         ec2InstancesService
 * @param {AutoScalingGroupSizeService} autoScalingGroupSizeService
 * @param {Asyncronizer}                asyncronizer
 * @param {AnomaliesCollector}          anomaliesCollector
 */
function AutoScalingGroupToggler(scheduleInterpreter, autoScalingGroupsService, ec2InstancesService, autoScalingGroupSizeService, asyncronizer, anomaliesCollector) {
  
  assert(scheduleInterpreter, "Missing 'scheduleInterpreter' argument.");
  assert(autoScalingGroupsService, "Missing 'autoScalingGroupsService' argument.");
  assert(ec2InstancesService, "Missing 'ec2InstancesService' argument.");
  assert(autoScalingGroupSizeService, "Missing 'autoScalingGroupSizeService argument.");
  assert(asyncronizer, "Missing 'asyncronizer argument.");
  assert(anomaliesCollector, "Missing 'anomaliesCollector argument.");
  
  var self = this;
  
  function enteringInstancesToStandby(autoScalingGroup, instanceIds, mainCallback) {
    
    console.log("Entering '%s' AutoScalingGroup instances to Standby", autoScalingGroup.Name);
    
    asyncronizer.serializeTasks([

      function storeAutoScalingGroupSize(callback) {
        autoScalingGroupSizeService.store(autoScalingGroup.Name, autoScalingGroup.Size, callback);
      },

      function setAutoScalingGroupMinimumSizeTask(callback) {
        autoScalingGroupsService.setMinimumSize(autoScalingGroup.Name, 0, callback);
      },

      function enterInstancesToStandbyTask(callback) {
        autoScalingGroupsService.enterInstancesStandby(autoScalingGroup.Name, instanceIds, callback);
      }
    ],

    function (error) {
      
      if (error) {
        var anomaly = new EnteringInstancesToStandbyAnomaly(autoScalingGroup.Name, instanceIds, error.message);
        anomaliesCollector.add(anomaly);
      }
      mainCallback();

    });

  }
  
  function stopAutoScalingGroupInstances(autoScalingGroup, instanceIds, mainCallback) {
    
    console.log("Stopping '%s' AutoScalingGroup instances", autoScalingGroup.Name);
    
    ec2InstancesService.stopInstances(instanceIds, function (error) {
      
      if (error) {
        var anomaly = new StoppingInstancesAnomaly(autoScalingGroup.Name, instanceIds, error.message);
        anomaliesCollector.add(anomaly);
      }
      mainCallback();

    });

  }
  
  function startAutoScalingGroupInstances(autoScalingGroup, instanceIds, mainCallback) {
    
    console.log("Starting '%s' AutoScalingGroup instances", autoScalingGroup.Name);
    
    ec2InstancesService.startInstances(instanceIds, function (error) {
      
      if (error) {
        var anomaly = new StartingInstancesAnomaly(autoScalingGroup.Name, instanceIds, error.message);
        anomaliesCollector.add(anomaly);
      }
      mainCallback();

    });

  }
  
  function exitingInstancesFromStandby(autoScalingGroup, instanceIds, mainCallback) {
    
    console.log("Exiting '%s' AutoScalingGroup instances from Standby", autoScalingGroup.Name);
    
    asyncronizer.serializeTasks([

      function exitInstancesFromStandbyTask(callback) {
        autoScalingGroupsService.exitInstancesStandby(autoScalingGroup.Name, instanceIds, callback);
      },

      function loadAutoScalingGroupSizeTask(callback) {
        autoScalingGroupSizeService.load(autoScalingGroup.Name, callback);
      },

      function setAutoScalingGroupMinimumSizeTask(callback, size) {
        autoScalingGroupsService.setMinimumSize(autoScalingGroup.Name, size.Min, callback);
      }
    ],

    function (error) {
      
      if (error) {
        var anomaly = new ExitingInstancesFromStandbyAnomaly(autoScalingGroup.Name, instanceIds, error.message);
        anomaliesCollector.add(anomaly);
      }
      mainCallback();

    });

  }
  
  /**
   * Analyzes the provided AutoScalingGroup and puts it OFF or ON considering
   * the schedule assigned to its instances.
   *
   * @param {AutoScalingGroupSchedule} autoScalingGroup
   * @param {Function}                 callback
   */
  self.toggle = function (autoScalingGroup, callback) {
    
    var instancesToStandby = [];
    var instancesToStop = [];
    var instancesToStart = [];
    var instancesToRestore = [];
    
    autoScalingGroup.Instances.forEach(function (instance) {
      
      var result = scheduleInterpreter(instance.Schedule.Value);
      
      if (result === Enums.SCHEDULE_ACTION.Skip) return;
      
      if (result === Enums.SCHEDULE_ACTION.Invalid) {
        var anomaly = new InvalidScheduleAnomaly(instance.Id, instance.Schedule.Value);
        anomaliesCollector.add(anomaly);
        return;
      }
      
      var shouldBeOn = (result === Enums.SCHEDULE_ACTION.On);
      var shouldBeOff = (result === Enums.SCHEDULE_ACTION.Off);
      
      var isInService = (instance.Lifecycle === "InService");
      var isInStandby = (instance.Lifecycle === "Standby");
      var isRunning = (instance.State === "running");
      var isStopped = (instance.State === "stopped");
      
      if (shouldBeOff && isInService) {
        instancesToStandby.push(instance.Id);
      }
      if (shouldBeOff && isInStandby && isRunning) {
        instancesToStop.push(instance.Id);
      }
      if (shouldBeOn && isInStandby && isStopped) {
        instancesToStart.push(instance.Id);
      }
      if (shouldBeOn && isInStandby && isRunning) {
        instancesToRestore.push(instance.Id);
      }

    });
    
    if (instancesToStandby.length) {
      enteringInstancesToStandby(autoScalingGroup, instancesToStandby, callback);
    } else if (instancesToStop.length) {
      stopAutoScalingGroupInstances(autoScalingGroup, instancesToStop, callback);
    } else if (instancesToStart.length) {
      startAutoScalingGroupInstances(autoScalingGroup, instancesToStart, callback);
    } else if (instancesToRestore.length) {
      exitingInstancesFromStandby(autoScalingGroup, instancesToRestore, callback);
    } else {
      console.log("No action to do on '%s' AutoScalingGroup", autoScalingGroup.Name);
      callback();
    }

  };

}

module.exports = AutoScalingGroupToggler;