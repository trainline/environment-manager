# resource "aws_lambda_event_source_mapping" "triggerInfraEnvironmentManagerLbSettingsRouter" {
#   batch_size        = 5
#   event_source_arn  = "${var.tableInfraConfigLbSettings_stream_arn}"
#   enabled           = true
#   function_name     = "${var.lambdaInfraEnvironmentManagerLbSettingsRouter_id}"
#   starting_position = "LATEST"
# }
# resource "aws_lambda_event_source_mapping" "triggerAuditInfraConfigLbSettings" {
#   batch_size        = 5
#   event_source_arn  = "${var.tableInfraConfigLbSettings_stream_arn}"
#   enabled           = true
#   function_name     = "${var.audit_lambda_function_ref}"
#   starting_position = "LATEST"
# }
# resource "aws_lambda_event_source_mapping" "auditTriggerConfigLBSettings" {
#   batch_size        = 25
#   event_source_arn  = "${var.tableInfraConfigLbSettings_stream_arn}"
#   enabled           = true
#   function_name     = "${var.lambdaInfraEnvironmentManagerAudit_id}"
#   starting_position = "LATEST"
# }
# resource "aws_lambda_event_source_mapping" "auditTriggerConfigNotificationSettings" {
#   batch_size        = 25
#   event_source_arn  = "${var.ConfigNotificationSettings_stream_arn}"
#   enabled           = true
#   function_name     = "${var.lambdaInfraEnvironmentManagerAudit_id}"
#   starting_position = "LATEST"
# }

