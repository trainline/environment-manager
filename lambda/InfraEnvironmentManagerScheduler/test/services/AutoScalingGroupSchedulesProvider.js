var assert                            = require('assert'),
    sinon                             = require('sinon'),
    Enums                             = require('../../Enums.js'),
    Asyncronizer                      = require('../../services/Asyncronizer.js'),
    AutoScalingGroupSchedulesProvider = require('../../services/AutoScalingGroupSchedulesProvider.js');

describe('[AutoScalingGroupSchedulesProvider] tests', function () {
  
  function arraifyArguments(source) {
    var array = [];
    for (var index in source) {
      array.push(source[index]);
    }
    return array;
  };
  
  var autoScalingGroupsServiceMock = {};
  var ec2InstancesProvider = {};
  var environmentsScheduleProviderMock = {};
  var anomaliesCollectorMock = {
    add: sinon.stub()
  };
  
  function givenTheEnvironmentsSchedule(data) {
    before(function () {
      environmentsScheduleProviderMock.get = function (callback) { callback(null, data); };
    });
  };
  
  function givenTheEC2Instances(/* Arguments */) {
    var data = arraifyArguments(arguments);
    before(function () {
      ec2InstancesProvider.getInstances = function (callback) { callback(null, data); };
    });
  };
  
  function givenTheAutoScalingGroups(/* Arguments */) {
    var data = arraifyArguments(arguments);
    before(function () {
      autoScalingGroupsServiceMock.getGroups = function (callback) { callback(null, data); };
    });
  };
  
  var target = new AutoScalingGroupSchedulesProvider(autoScalingGroupsServiceMock,
                                                     ec2InstancesProvider,
                                                     environmentsScheduleProviderMock,
                                                     new Asyncronizer(),
                                                     anomaliesCollectorMock);
  
  describe('When EC2 instance [EC2-A] belongs to the AutoScalingGroup [ASG-A]', function () {
    
    givenTheEnvironmentsSchedule({ st1 : 'environment-schedule' });
    
    givenTheEC2Instances({ Id: 'EC2-A', GroupName: 'ASG-A', Environment: 'st1', State: 'running' });
    
    givenTheAutoScalingGroups({ Name: 'ASG-A', Instances: [{ Id: 'EC2-A', Lifecycle: 'InService' }] });
    
    var resultError = null;
    var resultResponse = null;
    
    before('action', function () {
      target.getSchedules(function (error, response) {
        resultError = error;
        resultResponse = response;
      });
    });
    
    it('It should return the AutoScalingGroup [ASG-A]', function () {
      assert(resultResponse[0]);
      assert.equal(resultResponse[0].Name, 'ASG-A');
    });
    
    it('It should return the instance [EC2-A] inside the AutoScalingGroup', function () {
      assert(resultResponse[0].Instances);
      assert.equal(resultResponse[0].Instances.length, 1);
      
      assert(resultResponse[0].Instances[0]);
      assert(resultResponse[0].Instances[0].Schedule);
      assert.equal(resultResponse[0].Instances[0].Id, 'EC2-A');
      assert.equal(resultResponse[0].Instances[0].State, 'running');
      assert.equal(resultResponse[0].Instances[0].Lifecycle, 'InService');
    });

  }); // When EC2 instance [EC2-A] belongs to the AutoScalingGroup [ASG-A]
  
  describe('When EC2 instance [EC2-A] belongs to the AutoScalingGroup [ASG-A] and ', function () {
    
    givenTheEnvironmentsSchedule({ st1 : 'environment-schedule' });
    
    givenTheEC2Instances({ Id: 'EC2-A', GroupName: 'ASG-A', Environment: 'st1', State: 'running' });
    
    givenTheAutoScalingGroups({ Name: 'ASG-A', Instances: [{ Id: 'EC2-A', Lifecycle: 'InService' }] });
    
    var resultError = null;
    var resultResponse = null;
    
    before('action', function () {
      target.getSchedules(function (error, response) {
        resultError = error;
        resultResponse = response;
      });
    });
    
    it('It should return the AutoScalingGroup [ASG-A]', function () {
      assert(resultResponse[0]);
      assert.equal(resultResponse[0].Name, 'ASG-A');
    });
    
    it('It should return the instance [EC2-A] inside the AutoScalingGroup', function () {
      assert(resultResponse[0].Instances);
      assert.equal(resultResponse[0].Instances.length, 1);
      
      assert(resultResponse[0].Instances[0]);
      assert(resultResponse[0].Instances[0].Schedule);
      assert.equal(resultResponse[0].Instances[0].Id, 'EC2-A');
      assert.equal(resultResponse[0].Instances[0].State, 'running');
      assert.equal(resultResponse[0].Instances[0].Lifecycle, 'InService');
    });

  }); // When EC2 instance [EC2-A] belongs to the AutoScalingGroup [ASG-A]
  

  describe('When EC2 instance [EC2-A] has its <schedule> tag and belongs to the AutoScalingGroup [ASG-A]', function () {
    
    givenTheEnvironmentsSchedule({ st1 : 'environment-schedule' });

    givenTheEC2Instances({Id: 'EC2-A', GroupName: 'ASG-A', Environment: 'st1', Schedule: 'instance-schedule', State: 'running' });
    
    givenTheAutoScalingGroups({ Name: 'ASG-A', Instances: [{ Id: 'EC2-A', Lifecycle: 'InService' }] });
    
    var resultError = null;
    var resultResponse = null;
    
    before('action', function () {
      target.getSchedules(function (error, response) {
        resultError = error;
        resultResponse = response;
      });
    });
    
    it('Should return the instance schedule', function () {
      assert.equal(resultResponse[0].Instances[0].Schedule.Value, 'instance-schedule');
      assert.equal(resultResponse[0].Instances[0].Schedule.Source, Enums.SCHEDULE_SOURCE.Instance);
    });

  }); // When EC2 instance [EC2-A] has its <schedule> tag and belongs to the AutoScalingGroup [ASG-A]
  
  describe('When two EC2 instances [EC2-A] and [EC2-B] belong to the same AutoScalingGroup [ASG-A] but [EC2-B] instance has its own schedule', function () {
    
    givenTheEnvironmentsSchedule({ st1 : 'environment-schedule' });
    
    givenTheEC2Instances({ Id: 'EC2-A', GroupName: 'ASG-A', Environment: 'st1', State: 'running', Schedule: null },
                         { Id: 'EC2-B', GroupName: 'ASG-A', Environment: 'st1', State: 'running', Schedule: 'instance-schedule' });
    
    givenTheAutoScalingGroups({ Name: 'ASG-A', Instances: [{ Id: 'EC2-A', Lifecycle: 'InService' }, { Id: 'EC2-B', Lifecycle: 'InService' }], Schedule: 'asg-schedule' });
    
    var resultError = null;
    var resultResponse = null;
    
    before('action', function () {
      anomaliesCollectorMock.add.reset();
      target.getSchedules(function (error, response) {
        resultError = error;
        resultResponse = response;
      });
    });
    
    it('It should not return AutoScalingGroup schedule because an anomaly has found in it', function () {
      assert.equal(resultResponse.length, 0);
    });
    
    it('A [MismatchingAutoScalingGroupScheduleAnomaly] should be collected', function () {
      var call = anomaliesCollectorMock.add.getCall(0);
      
      assert(call);
      assert.deepEqual(call.args[0].GroupName, 'ASG-A');
      assert.deepEqual(call.args[0].Schedules, ['asg-schedule', 'instance-schedule']);
      assert.deepEqual(call.args[0].toString(), "AutoScalingGroup 'ASG-A' contains instances with mismatching schedule tags: asg-schedule, instance-schedule");
    });
  }); // When EC2 instance [EC2-A] with its <schedule> tag belongs to the AutoScalingGroup [ASG-A]
  
  describe('When both EC2 instance [EC2-A] and the AutoScalingGroup it belongs to do not have any <schedule> tag', function () {
    
    givenTheEnvironmentsSchedule({ st1 : 'environment-schedule' });
    
    givenTheEC2Instances({ Id: 'EC2-A', GroupName: 'ASG-A', Environment: 'st1', State: 'running', Schedule: null });
    
    givenTheAutoScalingGroups({ Name: 'ASG-A', Instances: [{ Id: 'EC2-A', Lifecycle: 'InService' }], Schedule: null });
    
    var resultError = null;
    var resultResponse = null;
    
    before('action', function () {
      target.getSchedules(function (error, response) {
        resultError = error;
        resultResponse = response;
      });
    });
    
    it('Should return the environment schedule', function () {
      assert.equal(resultResponse[0].Instances[0].Schedule.Value, 'environment-schedule');
      assert.equal(resultResponse[0].Instances[0].Schedule.Source, Enums.SCHEDULE_SOURCE.Environment);
    });

  }); // When EC2 instance [EC2-A] has its <schedule> tag and belongs to the AutoScalingGroup [ASG-A]
  
  describe('When EC2 instance [EC2-A], its AutoScalingGroup [ASG-A] and its environment do not have any <schedule> tag', function () {
    
    givenTheEnvironmentsSchedule({ st1 : null });
    
    givenTheEC2Instances({ Id: 'EC2-A', GroupName: 'ASG-A', Environment: 'st1', State: 'running', Schedule: null });
    
    givenTheAutoScalingGroups({ Name: 'ASG-A', Instances: [{ Id: 'EC2-A', Lifecycle: 'InService' }], Schedule: null });
    
    var resultError = null;
    var resultResponse = null;
    
    before('action', function () {
      target.getSchedules(function (error, response) {
        resultError = error;
        resultResponse = response;
      });
    });
    
    it('Should return the default schedule', function () {
      assert.equal(resultResponse[0].Instances[0].Schedule.Value, Enums.DEFAULT_SCHEDULE);
      assert.equal(resultResponse[0].Instances[0].Schedule.Source, Enums.SCHEDULE_SOURCE.Default);
    });

  }); // When EC2 instance [EC2-A] has its <schedule> tag and belongs to the AutoScalingGroup [ASG-A]
  
  describe('When EC2 instance [EC2-A] has no <environment> tag', function () {
    
    givenTheEnvironmentsSchedule({ st1 : 'environment-schedule' });
    
    givenTheEC2Instances({ Id: 'EC2-A', GroupName: 'ASG-A', Schedule: 'instance-schedule' });
    
    givenTheAutoScalingGroups({ Name: 'ASG-A', Instances: [{ Id: 'EC2-A' }] });
    
    var resultError = null;
    var resultResponse = null;
    
    before('action', function () {
      anomaliesCollectorMock.add.reset();
      
      target.getSchedules(function (error, response) {
        resultError = error;
        resultResponse = response;
      });
    });
    
    it('A [MissingInstanceEnvironmentTagAnomaly] should be collected', function () {
      var call = anomaliesCollectorMock.add.getCall(0);
      
      assert(call);
      assert.equal(call.args[0].InstanceId, 'EC2-A');
      assert.equal(call.args[0].toString(), "Instance 'EC2-A' has no Environment tag.");
    });

  }); // When EC2 instance [EC2-A] has no <environment> tag
  
  describe('When an AutoScalingGroup [ASG-A] contains an instance [EC2-B] that does not exist', function () {
    
    givenTheEnvironmentsSchedule({ st1 : 'environment-schedule' });
    
    givenTheEC2Instances({ Id: 'EC2-A', GroupName: 'ASG-A', Environment: 'st1', Schedule: 'instance-schedule' });
    
    givenTheAutoScalingGroups({ Name: 'ASG-A', Instances: [{ Id: 'EC2-A' }, {Id: 'EC2-B' }] });
    
    var resultError = null;
    var resultResponse = null;
    
    before('action', function () {
      anomaliesCollectorMock.add.reset();
      
      target.getSchedules(function (error, response) {
        resultError = error;
        resultResponse = response;
      });
    });
    
    it('A [MissingInstanceAnomaly] should be collected', function () {
      var call = anomaliesCollectorMock.add.getCall(0);

      assert(call);
      assert.equal(call.args[0].GroupName,  'ASG-A');
      assert.equal(call.args[0].InstanceId, 'EC2-B');
      assert.equal(call.args[0].toString(), "AutoScalingGroup 'ASG-A' contains instance 'EC2-B' that does not exist.");
    });

  }); // When an AutoScalingGroup [ASG-A] contains an instance [EC2-B] that does not exist

  describe('When EC2 instance [EC2-A] has an unknow environment name in its <environment> tag', function () {
    
    givenTheEnvironmentsSchedule({ st1 : 'environment-schedule' });
    
    givenTheEC2Instances({ Id: 'EC2-A', GroupName: 'ASG-A', Environment: 'xx1', Schedule: 'instance-schedule' });
    
    givenTheAutoScalingGroups({ Name: 'ASG-A', Instances: [{ Id: 'EC2-A' }] });
    
    var resultError = null;
    var resultResponse = null;
    
    before('action', function () {
      anomaliesCollectorMock.add.reset();
      
      target.getSchedules(function (error, response) {
        resultError = error;
        resultResponse = response;
      });
    });
    
    it('A [UnknownInstanceEnvironmentTagAnomaly] should be collected', function () {
      var call = anomaliesCollectorMock.add.getCall(0);
      
      assert(call);
      assert.equal(call.args[0].InstanceId, 'EC2-A');
      assert.equal(call.args[0].EnvironmentName, 'xx1');
      assert.equal(call.args[0].toString(), "Instance 'EC2-A' has an unknown Environment tag 'xx1'.");
    });

  }); // When EC2 instance [EC2-A] has an unknow environment name in its <environment> tag
  
  describe('When an AutoScalingGroup [ASG-A] is replacing an unhealthy instance', function () {
    
    givenTheEnvironmentsSchedule({ st1 : 'environment-schedule' });
    
    givenTheEC2Instances({ Id: 'EC2-A', GroupName: 'ASG-A', Environment: 'st1', Schedule: 'instance-schedule', State: 'stopping' },
                         { Id: 'EC2-B', GroupName: 'ASG-A', Environment: 'st1', Schedule: 'instance-schedule', State: 'pending' },
                         { Id: 'EC2-C', GroupName: 'ASG-B', Environment: 'st1', Schedule: 'instance-schedule', State: 'running' });

    givenTheAutoScalingGroups({
      Name: 'ASG-A',
      Instances: [
        { Id: 'EC2-A', Lifecycle: 'Terminating:Wait' }, 
        { Id: 'EC2-B', Lifecycle: 'Pending' }
      ]
    },
    {
      Name: 'ASG-B',
      Instances: [
        { Id: 'EC2-C', Lifecycle: 'InService' }
      ]
    });
    
    var resultError = null;
    var resultResponse = null;
    
    before('action', function () {
      anomaliesCollectorMock.add.reset();
      
      target.getSchedules(function (error, response) {
        resultError = error;
        resultResponse = response;
      });
    });
    
    it('AutoScalingGroup should be skipped', function () {
      assert.equal(resultResponse.length,1);
      assert.equal(resultResponse[0].Name, 'ASG-B');
    });    
    
    it('No anomalies should be collected', function () {
      assert(!anomaliesCollectorMock.add.called);
    });

  }); // When an AutoScalingGroup [ASG-A] contains two instance in a different state

  describe('When an AutoScalingGroup [ASG-A] contains two instance in a different state', function () {
    
    givenTheEnvironmentsSchedule({ st1 : 'environment-schedule' });
    
    givenTheEC2Instances({ Id: 'EC2-A', GroupName: 'ASG-A', Environment: 'st1', Schedule: 'instance-schedule', State: 'running' },
                         { Id: 'EC2-B', GroupName: 'ASG-A', Environment: 'st1', Schedule: 'instance-schedule', State: 'stopped' });
    
    givenTheAutoScalingGroups({ Name: 'ASG-A', Instances: [{ Id: 'EC2-A', Lifecycle: 'InService' }, { Id: 'EC2-B', Lifecycle: 'InService' }] });
    
    var resultError = null;
    var resultResponse = null;
    
    before('action', function () {
      anomaliesCollectorMock.add.reset();
      
      target.getSchedules(function (error, response) {
        resultError = error;
        resultResponse = response;
      });
    });
    
    it('A [MismatchingAutoScalingGroupStateAnomaly] should be collected', function () {
      var call = anomaliesCollectorMock.add.getCall(0);
      
      assert(call);
      assert.equal(call.args[0].GroupName, 'ASG-A');
      assert.deepEqual(call.args[0].States, ['running', 'stopped']);
      assert.equal(call.args[0].toString(), "AutoScalingGroup 'ASG-A' instances have an heterogeneous state: running, stopped");
    });

  }); // When an AutoScalingGroup [ASG-A] contains two instance in a different state

  describe('When an AutoScalingGroup [ASG-A] contains two instance in a different lifecycle', function () {
    
    givenTheEnvironmentsSchedule({ st1 : 'environment-schedule' });
    
    givenTheEC2Instances({ Id: 'EC2-A', GroupName: 'ASG-A', Environment: 'st1', Schedule: 'instance-schedule', State: 'running' },
                         { Id: 'EC2-B', GroupName: 'ASG-A', Environment: 'st1', Schedule: 'instance-schedule', State: 'running' });
    
    givenTheAutoScalingGroups({ Name: 'ASG-A', Instances: [{ Id: 'EC2-A', Lifecycle: 'InService' }, { Id: 'EC2-B', Lifecycle: 'Standby' }] });
    
    var resultError = null;
    var resultResponse = null;
    
    before('action', function () {
      anomaliesCollectorMock.add.reset();
      
      target.getSchedules(function (error, response) {
        resultError = error;
        resultResponse = response;
      });
    });
    
    it('A [MismatchingAutoScalingGroupLifeCycleAnomaly] should be collected', function () {
      var call = anomaliesCollectorMock.add.getCall(0);
      
      assert(call);
      assert.equal(call.args[0].GroupName, 'ASG-A');
      assert.deepEqual(call.args[0].Lifecycle, ['InService', 'Standby']);
      assert.equal(call.args[0].toString(), "AutoScalingGroup 'ASG-A' instances have an heterogeneous lifecycle: InService, Standby");
    });

  }); // When an AutoScalingGroup [ASG-A] contains two instance in a different state

}); // [AutoScalingGroupSchedulesProvider] tests
