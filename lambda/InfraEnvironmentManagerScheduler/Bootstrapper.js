var Asyncronizer                      = require('./services/Asyncronizer.js'),
    InstanceContractConverter         = require('./services/InstanceContractConverter.js'),
    AutoScalingGroupContractConverter = require('./services/AutoScalingGroupContractConverter.js'),
    DynamoClientFactory               = require('./services/DynamoClientFactory.js'),
    DynamoTableProvider               = require('./services/DynamoTableProvider.js'),
    EnvironmentsScheduleProvider      = require('./services/EnvironmentsScheduleProvider.js'),
    AutoScalingGroupSizeService       = require('./services/AutoScalingGroupSizeService.js'),
    EC2ClientFactory                  = require('./services/EC2ClientFactory.js'),
    EC2InstancesService               = require('./services/EC2InstancesService.js'),
    AutoScalingClientFactory          = require('./services/AutoScalingClientFactory.js'),
    AutoScalingGroupsService          = require('./services/AutoScalingGroupsService.js'),
    AutoScalingGroupSchedulesProvider = require('./services/AutoScalingGroupSchedulesProvider.js'),
    AnomaliesCollector                = require('./services/AnomaliesCollector.js'),
    AutoScalingGroupToggler           = require('./services/AutoScalingGroupToggler.js'),
    GovernatorService                 = require('./services/GovernatorService.js'),
    ScheduleInterpreter               = require('./services/lastCron.js').ScheduleInterpreter;

function Bootstrapper() {

  var self = this;

  self.createGovernator = function() {
    var region = "eu-west-1";
    var asyncronizer = new Asyncronizer();
    var scheduleInterpreter = ScheduleInterpreter;
    var instanceContractConverter = new InstanceContractConverter();
    var autoScalingGroupContractConverter = new AutoScalingGroupContractConverter();
    var anomaliesCollector = new AnomaliesCollector();
    var dynamoClientFactory = new DynamoClientFactory(region);
    var ec2ClientFactory = new EC2ClientFactory(region);
    var autoScalingClientFactory = new AutoScalingClientFactory(region);
    var dynamoTableProvider = new DynamoTableProvider(dynamoClientFactory);
    var environmentsScheduleProvider = new EnvironmentsScheduleProvider(dynamoTableProvider, anomaliesCollector);
    var autoScalingGroupSizeService = new AutoScalingGroupSizeService(dynamoTableProvider);
    var ec2InstancesService = new EC2InstancesService(ec2ClientFactory, instanceContractConverter);
    var autoScalingGroupsService = new AutoScalingGroupsService(autoScalingClientFactory, autoScalingGroupContractConverter);
    var autoScalingGroupSchedulesProvider = new AutoScalingGroupSchedulesProvider(autoScalingGroupsService, ec2InstancesService, environmentsScheduleProvider, asyncronizer, anomaliesCollector);
    var autoScalingGroupToggler = new AutoScalingGroupToggler(scheduleInterpreter, autoScalingGroupsService, ec2InstancesService, autoScalingGroupSizeService, asyncronizer, anomaliesCollector);
    var governatorService = new GovernatorService(autoScalingGroupSchedulesProvider, autoScalingGroupToggler, asyncronizer, anomaliesCollector);
    
    return governatorService;
  };

}

module.exports = Bootstrapper;