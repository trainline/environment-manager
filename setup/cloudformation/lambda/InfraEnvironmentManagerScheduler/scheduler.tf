variable package { type = "string" }
variable scheduler_vpc_subnet_ids { type = "list" }
variable scheduler_env_vars { type = "map" }
variable scheduler_kms_key_arn { type = "string" }

provider "aws" {
  region = "eu-west-1"
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role_policy_attachment" "scheduler_role_policy_attach" {
  role       = "${aws_iam_role.scheduler_role.name}"
  policy_arn = "${aws_iam_policy.scheduler_role_policy.arn}"
}

resource "aws_iam_role" "scheduler_role" {
  name = "role-em-scheduler"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_policy" "scheduler_role_policy" {
  name = "policy-em-scheduler"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DescribeInstances",
        "ec2:DeleteNetworkInterface",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "autoscaling:EnterStandby",
        "autoscaling:ExitStandby",
        "xray:PutTelemetryRecords",
        "xray:PutTraceSegments",
        "sts:AssumeRole",
        "kms:Decrypt"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_security_group" "scheduler_sg" {
  name        = "em-scheduler"
  description = "Allow all outbound traffic"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lambda_function" "scheduler" {
  filename = "${var.package}"
  function_name = "em-scheduler"
  description = "Turns on/off instances based on instance, asg or environment schedule"
  memory_size = 320
  timeout = 30
  role = "${aws_iam_role.scheduler_role.arn}"
  handler = "index.handler"
  source_code_hash = "${base64sha256(file("${var.package}"))}"
  runtime = "nodejs6.10"

  kms_key_arn = "${var.scheduler_kms_key_arn}"

  vpc_config {
    subnet_ids = "${var.scheduler_vpc_subnet_ids}"
    security_group_ids = [ "${aws_security_group.scheduler_sg.id}" ]
  }

  environment {
    variables = "${var.scheduler_env_vars}"
  }
}

resource "aws_cloudwatch_event_rule" "every_five_minutes" {
    name = "every-5-minutes"
    description = "5 minute repeating cloudwatch event"
    schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "scheduler_cloudwatch_scheduled_trigger" {
    rule = "${aws_cloudwatch_event_rule.every_five_minutes.name}"
    target_id = "em-scheduler-trigger"
    arn = "${aws_lambda_function.scheduler.arn}"
}

resource "aws_lambda_permission" "scheduler_cloudwatch_scheduled_trigger_permission" {
    statement_id = "em-scheduler-trigger-permission"
    action = "lambda:InvokeFunction"
    function_name = "${aws_lambda_function.scheduler.function_name}"
    principal = "events.amazonaws.com"
    source_arn = "${aws_cloudwatch_event_rule.every_five_minutes.arn}"
}