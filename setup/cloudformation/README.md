# CloudFormation TODO

* Generate CloudFormation templates (some of the roles require a static list of accounts to trust - search for comments in *.template.json).
* There is a limit of 51200 characters the AWS CLI permits in a stack; make them terse to avoid exceeding this.
* Remove hard-coded config from tools/deploy.js.