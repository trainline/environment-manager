resource "aws_cloudwatch_event_rule" "every_five_minutes" {
  name                = "every-5-minutes"
  description         = "5 minute repeating cloudwatch event"
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "scheduler_cloudwatch_scheduled_trigger" {
  rule      = "${aws_cloudwatch_event_rule.every_five_minutes.name}"
  target_id = "em-scheduler-trigger"
  arn       = "${aws_lambda_function.scheduler.arn}"
}
