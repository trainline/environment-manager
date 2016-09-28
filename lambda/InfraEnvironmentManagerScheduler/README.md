# InfraGovernatorScheduler


## Filtering the affected instances

Just a couple of changes are needed to the Bootstrapper.js file to filter the ASGs to manage:

Adding following required module:
```var AutoScalingGroupsServiceDecorator = require('./services/AutoScalingGroupsServiceDecorator.js');```

Changing following object initialization:
```var autoScalingGroupsService = new AutoScalingGroupsService(autoScalingClientFactory, autoScalingGroupContractConverter);```
Into the following
```var autoScalingGroupsService = new AutoScalingGroupsServiceDecorator(new AutoScalingGroupsService(autoScalingClientFactory, autoScalingGroupContractConverter));```

“/services/AutoScalingGroupServiceDecorator.js” file is the one that perform ASG filtering. In this case filter by ASG Name == “sb9-*”
