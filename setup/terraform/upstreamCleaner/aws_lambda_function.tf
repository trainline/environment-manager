resource "aws_lambda_function" "upstream_cleaner" {
  filename         = "lambda.zip"
  function_name    = "em_upstream_cleaner"
  role             = "${aws_iam_role.upstream_cleaner.arn}"
  handler          = "exports.handler"
  source_code_hash = "${base64sha256(file("lambda.zip"))}"
  runtime          = "nodejs6.10"

  environment {
    variables = {
      TABLE_NAME = "ConfigLBUpstream"
    }
  }
}

resource "aws_cloudwatch_event_rule" "every_five_minutes" {
    name = "every-five-minutes"
    description = "Fires every five minutes"
    schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "check_foo_every_five_minutes" {
    rule = "${aws_cloudwatch_event_rule.every_five_minutes.name}"
    target_id = "check_foo"
    arn = "${aws_lambda_function.upstream_cleaner.arn}"
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_check_foo" {
    statement_id = "AllowExecutionFromCloudWatch"
    action = "lambda:InvokeFunction"
    function_name = "${aws_lambda_function.upstream_cleaner.function_name}"
    principal = "events.amazonaws.com"
    source_arn = "${aws_cloudwatch_event_rule.every_five_minutes.arn}"
}