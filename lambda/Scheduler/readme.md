# Environment Manager Scheduler

The scheduler is designed to run as a scheduled lambda function within one or more AWS accounts managed by Environment Manager. Its responsibility is to start and stop instances in the AWS account according to their schedule.

This scheduler supplements the existing scheduler by providing support for ec2 instances which are not members of auto-scaling groups (which we call stand-alone instances). In time this scheduler will support all instances and the existing scheduler will be decommissioned.

## Getting Started

```
cd ./lambda/scheduler
npm install
```

### Running the tests

```
npm test
```

### Running locally

There are two ways you can run this lambda locally.

- First, you can use [lambda-local](https://www.npmjs.com/package/lambda-local) which will execute index.handler in the same way that AWS does.
- Second you can run ``` node local ``` in your command prompt. This will execute ./local/index.js which will run the scheduler manually.

In both cases an AWS access key and secret key must be provided in one of the default locations (such as environment variables) in order to access your AWS account.

### Configuration

The root of the project must contain a config.json file which contains the settings necessary to run the application. A sample config file is included at ./local/config.json and can be modified with the necessary settings to run the function locally.

```
{
  "limitToEnvironment": "xxx",
  "whatIf": true,
  "listSkippedInstances": true,
  "em": {
    "host": "environment-manager-domain-name",
    "credentials": {
      "username": "username",
      "password": "password"
    }
  },
  "aws": {
    "region": "eu-west-1"
  }
}
```

- **limitToEnvironment**: An optional regular expression which, if provided, will cause the scheduler to limit processing to those instances with a matching 'environment' tag.
- **whatIf**: If set to true this flag will prevent destructive operations such as starting and stopping instances from running. Successful responses will be simulated.
- **em**: The hostname (or IP) and credentials needed to access the Environment Manager service which governs this AWS account.
- **aws**: Configuration information provided to the AWS SDK when constructing the EC2 service.

### Packaging

In order to execute this lambda in AWS all files must be added to a .zip package along with a suitable config.json file in the root.

Exceptions include:

- ./local
- ./**/\*.spec.js
- Any dev specific module dependencies (currently mocha and chai)

The package can then be uploaded to an AWS function. A task will shortly be provided for automating the construction and deployment of the lambda function.

### IAM permissions

The role under which the Lambda is configured to run must have the permissions found in the following sample policy:

```
{
  "Version" : "2012-10-17",
  "Statement" : [
    {
      "Effect" : "Allow",
      "Action" : [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DescribeInstances",
        "ec2:DeleteNetworkInterface",
        "ec2:StartInstances",
        "ec2:StopInstances"
      ],
      "Resource" : [
          "*"
      ]
    }
  ]
}
```