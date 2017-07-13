resource "aws_lambda_function" "lambdaInfraEnvironmentManagerAudit" {
  filename         = "./lambda/InfraEnvironmentManagerAudit/infra-environment-manager-audit.zip"
  function_name    = "InfraEnvironmentManagerAudit"
  role             = "${aws_iam_role.roleInfraEnvironmentManagerAudit.arn}"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("./lambda/InfraEnvironmentManagerAudit/infra-environment-manager-audit.zip"))}"
  runtime          = "nodejs4.3"
  memory_size      = 128
  timeout          = 3
  description      = "This function responds to a DynamoDB stream event by writing the value of each record before and after the change to an audit log."
}

resource "aws_lambda_function" "lambdaInfraAsgScale" {
  filename         = "./lambda/InfraAsgLambdaScale/InfraAsgLambdaScale.zip"
  function_name    = "InfraAsgScale"
  role             = "${aws_iam_role.roleInfraEnvironmentManagerAudit.arn}"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("./lambda/InfraAsgLambdaScale/InfraAsgLambdaScale.zip"))}"
  runtime          = "nodejs4.3"
  memory_size      = 128
  timeout          = 30
  description      = "This function scales auto scaling groups."
}

resource "aws_lambda_function" "lambdaInfraEnvironmentManagerLbSettingsRouter" {
  filename         = "./lambda/InfraEnvironmentManagerLbSettingsRouter/InfraEnvironmentManagerLbSettingsRouter.zip"
  function_name    = "lambdaInfraEnvironmentManagerLbSettingsRouter"
  role             = "${aws_iam_role.roleInfraEnvironmentManagerAudit.arn}"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("./lambda/InfraEnvironmentManagerLbSettingsRouter/InfraEnvironmentManagerLbSettingsRouter.zip"))}"
  runtime          = "nodejs4.3"
  memory_size      = 128
  timeout          = 30
  description      = "This function scales auto scaling groups."
}

# Outputs

output "lambdaInfraEnvironmentManagerAudit_id" {
  value = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
}

output "lambdaInfraEnvironmentManagerLbSettingsRouter_id" {
  value = "${aws_lambda_function.lambdaInfraEnvironmentManagerLbSettingsRouter.id}"
}
