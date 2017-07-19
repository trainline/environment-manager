resource "aws_lambda_function" "audit" {
  filename         = "./lambda/InfraEnvironmentManagerAudit/infra-environment-manager-audit.zip"
  function_name    = "${var.stack}-${var.app}-audit"
  role             = "${aws_iam_role.audit.arn}"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("./lambda/InfraEnvironmentManagerAudit/infra-environment-manager-audit.zip"))}"
  runtime          = "nodejs4.3"
  memory_size      = 128
  timeout          = 3
  description      = "This function responds to a DynamoDB stream event by writing the value of each record before and after the change to an audit log."
}
