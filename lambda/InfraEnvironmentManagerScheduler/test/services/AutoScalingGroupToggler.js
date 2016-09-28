var assert                   = require("assert"),
    sinon                    = require("sinon"),
    AutoScalingGroupSchedule = require('../../contracts/AutoScalingGroupSchedule.js'),
    InstanceSchedule         = require('../../contracts/InstanceSchedule.js'),
    Asyncronizer             = require('../../services/Asyncronizer.js'),
    AutoScalingGroupToggler  = require('../../services/AutoScalingGroupToggler.js'),
    Enums                    = require('../../Enums.js');

describe("[AutoScalingGroupToggler] tests", function () {

  var scheduleInterpreterMock = sinon.stub();

  var autoScalingGroupsServiceMock = {
    enterInstancesStandby: sinon.stub(),
    exitInstancesStandby: sinon.stub(),
    setMinimumSize: sinon.stub()
  };

  var ec2InstancesServiceMock = {
    stopInstances: sinon.stub(),
    startInstances: sinon.stub()
  };

  var autoScalingGroupSizeServiceMock = {
    load: sinon.stub(),
    store: sinon.stub()
  }

  var anomaliesCollectorMock = {
    add: sinon.stub()
  }

  var terget = new AutoScalingGroupToggler(scheduleInterpreterMock,
                                           autoScalingGroupsServiceMock,
                                           ec2InstancesServiceMock,
                                           autoScalingGroupSizeServiceMock,
                                           new Asyncronizer(),
                                           anomaliesCollectorMock);

  function bootstrapTest() {
    before('bootstrap test', function() {
      scheduleInterpreterMock.reset();
      scheduleInterpreterMock.withArgs("should-be-off").returns(Enums.SCHEDULE_ACTION.Off);
      scheduleInterpreterMock.withArgs("should-be-on").returns(Enums.SCHEDULE_ACTION.On);

      autoScalingGroupsServiceMock.enterInstancesStandby.reset();
      autoScalingGroupsServiceMock.enterInstancesStandby.callsArg(2);
      autoScalingGroupsServiceMock.exitInstancesStandby.reset();
      autoScalingGroupsServiceMock.exitInstancesStandby.callsArg(2);
      autoScalingGroupsServiceMock.setMinimumSize.reset();
      autoScalingGroupsServiceMock.setMinimumSize.callsArg(2);

      ec2InstancesServiceMock.stopInstances.reset();
      ec2InstancesServiceMock.stopInstances.callsArg(1);
      ec2InstancesServiceMock.startInstances.reset();
      ec2InstancesServiceMock.startInstances.callsArg(1);

      autoScalingGroupSizeServiceMock.load.reset();
      autoScalingGroupSizeServiceMock.load.callsArg(1);
      autoScalingGroupSizeServiceMock.store.reset();
      autoScalingGroupSizeServiceMock.store.callsArg(2);
    });
  }

  describe("When all instances are [InService] and [running] and scheduled to be off", function() {

    var instanceA = new InstanceSchedule("EC2-A", "running", "InService", "should-be-off");
    var instanceB = new InstanceSchedule("EC2-B", "running", "InService", "should-be-off");
    var size = { Min: 1, Desired: 2, Max: 3 };

    var autoScalingGroup = new AutoScalingGroupSchedule("ASG-A", size, [instanceA, instanceB]);

    bootstrapTest();

    before("Toggling an AutoScalingGroup", function(done) {
      terget.toggle(autoScalingGroup, done);
    });

    it("It should store current AutoScalingGroup size", function() {
      var call = autoScalingGroupsServiceMock.setMinimumSize.getCall(0);

      assert(call);
      assert.deepEqual(call.args[0], autoScalingGroup.Name);
      assert.deepEqual(call.args[1], 0);
    });

    it("It should set AutoScalingGroup minimum size to 0", function() {
      var call = autoScalingGroupSizeServiceMock.store.getCall(0);

      assert(call);
      assert.deepEqual(call.args[0], autoScalingGroup.Name);
      assert.deepEqual(call.args[1], autoScalingGroup.Size);
    });

    it("It should put all instances in standby", function() {
      var call = autoScalingGroupsServiceMock.enterInstancesStandby.getCall(0);

      assert(call);
      assert.equal(call.args[0], autoScalingGroup.Name);
      assert.deepEqual(call.args[1], [instanceA.Id, instanceB.Id]);
    });

  }); // When all instances are [InService] and [running] and scheduled to be off

  describe("When all instances are [Standby] and [running] and scheduled to be off", function () {

    var instanceA = new InstanceSchedule("EC2-A", "running", "Standby", "should-be-off");
    var instanceB = new InstanceSchedule("EC2-B", "running", "Standby", "should-be-off");
    var size = { Min: 0, Desired: 0, Max: 3 };

    var autoScalingGroup = new AutoScalingGroupSchedule("ASG-A", size, [instanceA, instanceB]);

    bootstrapTest();

    before("Toggling an AutoScalingGroup", function (done) {
      terget.toggle(autoScalingGroup, done);
    });

    it("It should stop all instances", function () {
      var call = ec2InstancesServiceMock.stopInstances.getCall(0);

      assert(call);
      assert.deepEqual(call.args[0], [instanceA.Id, instanceB.Id]);
    });

  }); // When all instances are [Standby] and [running] and scheduled to be off

  describe("When all instances are [Standby] and [stopped] and scheduled to be on", function () {

    var instanceA = new InstanceSchedule("EC2-A", "stopped", "Standby", "should-be-on");
    var instanceB = new InstanceSchedule("EC2-B", "stopped", "Standby", "should-be-on");
    var size = { Min: 0, Desired: 0, Max: 3 };

    var autoScalingGroup = new AutoScalingGroupSchedule("ASG-A", size, [instanceA, instanceB]);

    bootstrapTest();

    before("Toggling an AutoScalingGroup", function (done) {
      terget.toggle(autoScalingGroup, done);
    });

    it("It should start all instances", function () {
      var call = ec2InstancesServiceMock.startInstances.getCall(0);

      assert(call);
      assert.deepEqual(call.args[0], [instanceA.Id, instanceB.Id]);
    });

  }); // When all instances are [Standby] and [stopped] and scheduled to be on

  describe("When all instances are [Standby] and [running] and scheduled to be on", function () {

    var instanceA = new InstanceSchedule("EC2-A", "running", "Standby", "should-be-on");
    var instanceB = new InstanceSchedule("EC2-B", "running", "Standby", "should-be-on");
    var size = { Min: 0, Desired: 0, Max: 3 };

    var autoScalingGroup = new AutoScalingGroupSchedule("ASG-A", size, [instanceA, instanceB]);

    var previouslyStoredSize = {
      Min: 1,
      Desired: 2,
      Max: 3
    };

    bootstrapTest();

    before('Properly moching the services', function() {

      autoScalingGroupsServiceMock.setMinimumSize.reset();

      autoScalingGroupSizeServiceMock
        .load
        .withArgs(autoScalingGroup.Name, sinon.match.func)
        .callsArgWith(1, null, previouslyStoredSize);

    });

    before("Toggling an AutoScalingGroup", function (done) {
      terget.toggle(autoScalingGroup, done);
    });

    it("It should exit all instances from standby", function () {
      var call = autoScalingGroupsServiceMock.exitInstancesStandby.getCall(0);

      assert(call);
      assert.deepEqual(call.args[0], autoScalingGroup.Name);
      assert.deepEqual(call.args[1], [instanceA.Id, instanceB.Id]);
    });

    it("It should restore the AutoScalingGroup size to the previously stored one", function () {
      var call = autoScalingGroupsServiceMock.setMinimumSize.getCall(0);



      assert(call);
      assert.deepEqual(call.args[0], autoScalingGroup.Name);
      assert.deepEqual(call.args[1], previouslyStoredSize.Min);
    });

  }); // When all instances are [Standby] and [running] and scheduled to be on

  describe("When all instances are [InService] and [running] and scheduled to be on", function () {

    var instanceA = new InstanceSchedule("EC2-A", "running", "InService", "should-be-on");
    var instanceB = new InstanceSchedule("EC2-B", "running", "InService", "should-be-on");
    var size = { Min: 1, Desired: 2, Max: 3 };

    var autoScalingGroup = new AutoScalingGroupSchedule("ASG-A", size, [instanceA, instanceB]);

    bootstrapTest();

    before("Toggling an AutoScalingGroup", function (done) {
      terget.toggle(autoScalingGroup, done);
    });

    it("It should not do anything", function () {
      assert.equal(autoScalingGroupsServiceMock.enterInstancesStandby.called, false);
      assert.equal(autoScalingGroupSizeServiceMock.store.called, false);
      assert.equal(autoScalingGroupsServiceMock.setMinimumSize.called, false);
    });

  }); // When all instances are [InService] and [running] and scheduled to be on

  describe("When all instances are [Standby] and [stopped] and scheduled to be off", function () {

    var instanceA = new InstanceSchedule("EC2-A", "stopped", "Standby", "should-be-off");
    var instanceB = new InstanceSchedule("EC2-B", "stopped", "Standby", "should-be-off");
    var size = { Min: 1, Desired: 2, Max: 3 };

    var autoScalingGroup = new AutoScalingGroupSchedule("ASG-A", size, [instanceA, instanceB]);

    bootstrapTest();

    before("Toggling an AutoScalingGroup", function (done) {
      terget.toggle(autoScalingGroup, done);
    });

    it("It should not do anything", function () {
      assert.equal(autoScalingGroupsServiceMock.enterInstancesStandby.called, false);
      assert.equal(autoScalingGroupSizeServiceMock.store.called, false);
      assert.equal(autoScalingGroupsServiceMock.setMinimumSize.called, false);
    });

  }); // When all instances are [Standby] and [stopped] and scheduled to be off

});
