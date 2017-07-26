# resource "aws_lambda_function" "audit" {
#   filename         = "./lambda/InfraEnvironmentManagerAudit/infra-environment-manager-audit.zip"
#   function_name    = "${var.stack}-audit"
#   role             = "${aws_iam_role.audit.arn}"
#   handler          = "index.handler"
#   source_code_hash = "${base64sha256(file("./lambda/InfraEnvironmentManagerAudit/infra-environment-manager-audit.zip"))}"
#   runtime          = "nodejs4.3"
#   memory_size      = 128
#   timeout          = 3
#   description      = "This function responds to a DynamoDB stream event by writing the value of each record before and after the change to an audit log."
# }

resource "aws_lambda_function" "scheduler" {
  filename         = "${var.scheduler_package}"
  function_name    = "${var.stack}-scheduler"
  description      = "Turns on/off instances based on instance, asg or environment schedule"
  memory_size      = 320
  timeout          = 30
  role             = "${aws_iam_role.scheduler_role.arn}"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("${var.scheduler_package}"))}"
  runtime          = "nodejs6.10"

  vpc_config {
    subnet_ids         = ["${var.subnet_ids["private_a"]}", "${var.subnet_ids["private_b"]}", "${var.subnet_ids["private_c"]}"]
    security_group_ids = ["${aws_security_group.scheduler_sg.id}"]
  }

  environment {
    variables {
      EM_HOST = "http://${aws_elb.app.dns_name}"
    }
  }
}

resource "aws_lambda_permission" "scheduler_cloudwatch_scheduled_trigger_permission" {
  statement_id  = "em-scheduler-trigger-permission"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.scheduler.function_name}"
  principal     = "events.amazonaws.com"
  source_arn    = "${aws_cloudwatch_event_rule.every_five_minutes.arn}"
}
