resource "aws_sqs_queue" "orchestrator_deadletter" {
  name = "${var.stack}-infra-em-orchestrator-DLQ"
}

resource "aws_sqs_queue" "orchestrator" {
  name = "${var.stack}-infra-em-orchestrator"
  redrive_policy = "{\"deadLetterTargetArn\":\"${aws_sqs_queue.orchestrator_deadletter.arn}\",\"maxReceiveCount\":3}"
}

resource "aws_sqs_queue" "worker_deadletter" {
  name = "${var.stack}-infra-em-worker-DLQ"
}

resource "aws_sqs_queue" "worker" {
  name = "${var.stack}-infra-em-worker"
  redrive_policy = "{\"deadLetterTargetArn\":\"${aws_sqs_queue.worker_deadletter.arn}\",\"maxReceiveCount\":3}"
}

# Outputs
