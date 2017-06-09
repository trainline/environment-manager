# Environment Manager CloudFormation Templates

This project can be used to generate and deploy a set of CloudFormation templates that define the resources required to run Environment Manager.

## Prerequisites

* The [AWS CloudFormation CLI](http://docs.aws.amazon.com/cli/latest/userguide/installing.html) must be installed and available on your `PATH`.

## Generating the CloudFormation Templates

The project contains CloudFormation templates (`*.template.json`, `*.template.yaml`) and javascript modules that take a configuration as an argument and return a CloudFormation template (`*.template.js`).

The following command will build all the CloudFormation templates (and the Lambda functions on which they depend) using the configuration specified in `config.yaml`:

```
npm run build -- --config ./config.yaml
```

The following configuration properties affect template generation.
| Configuration Property | Description |
|---|---|
| managedAccounts | The list of accounts that will be managed by this installation of Environment Manager |

## Deploying the CloudFormation Stacks

The following command will use the [AWS CloudFormation CLI](http://docs.aws.amazon.com/cli/latest/userguide/installing.html) to deploy your templates.

```
npm run deploy -- --config ./config.yaml
```

The following configuration properties affect the deployment.
| Configuration Property | Description |
|---|---|
| stackName | The name of the target stack to create/update |
| templateFile | The template to deploy. Only this template and its dependencies will be deployed |
| s3bucket | The bucket that the templates will be uploaded to |
| parameters | The arguments to pass to the template when creating/updating the stack |
