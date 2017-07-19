resource "aws_sns_topic" "alert_sns_topic" {
  name = "${var.stack}-alert-sns-topic"
}
