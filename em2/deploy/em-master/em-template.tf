# This file currently contains items that were missed, must be configured later in a script once this has complete...
# Generally items that are not essential to get up and running but need to be looked into. 
# resource "aws_lambda_event_source_mapping" "auditTriggerConfigLBUpstream" {
#   batch_size        = 25
#   event_source_arn  = "${var.ConfigLBUpstream.stream_arn}"
#   enabled           = true
#   function_name     = "${var.lambdaInfraEnvironmentManagerAudit_id}"
#   starting_position = "LATEST"
# }
# resource "aws_lambda_event_source_mapping" "auditTriggerConfigServices" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.ConfigServices.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }
# resource "aws_lambda_event_source_mapping" "auditTriggerInfraConfigClusters" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.InfraConfigClusters.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }
# resource "aws_lambda_event_source_mapping" "auditTriggerConfigEnvironments" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.ConfigEnvironments.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }
# resource "aws_lambda_event_source_mapping" "auditTriggerInfraConfigPermissions" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.InfraConfigPermissions.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }
# resource "aws_lambda_event_source_mapping" "auditTriggerConfigEnvironmentTypes" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.ConfigEnvironmentTypes.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }
# resource "aws_lambda_event_source_mapping" "auditTriggerConfigDeploymentMaps" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.ConfigDeploymentMaps.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }
# resource "aws_lambda_event_source_mapping" "auditTriggerInfraConfigAccounts" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.InfraConfigAccounts.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }
# resource "aws_iam_role_policy" "roleInfraEnvironmentManagerAuditPolicy" {
#   name = "roleInfraEnvironmentManagerAuditPolicy"
#   role = "${aws_iam_role.roleInfraEnvironmentManagerAudit.id}"
#   policy = <<EOF
# {
# "Version": "2012-10-17",
# "Statement": [
#   {
#       "Effect": "Allow",
#       "Action": [
#           "dynamodb:GetRecords",
#           "dynamodb:GetShardIterator",
#           "dynamodb:DescribeStream",
#           "dynamodb:ListStreams"
#       ],
#       "Resource": [
#           "${aws_dynamodb_table.ConfigLBSettings.stream_arn}",
#           "${aws_dynamodb_table.ConfigLBUpstream.stream_arn}",
#           "${aws_dynamodb_table.ConfigServices.stream_arn}",
#           "${aws_dynamodb_table.InfraConfigClusters.stream_arn}",
#           "${aws_dynamodb_table.ConfigEnvironments.stream_arn}",
#           "${aws_dynamodb_table.InfraConfigPermissions.stream_arn}",
#           "${aws_dynamodb_table.ConfigEnvironmentTypes.stream_arn}",
#           "${aws_dynamodb_table.ConfigDeploymentMaps.stream_arn}",
#           "${aws_dynamodb_table.InfraConfigAccounts.stream_arn}",
#           "${aws_dynamodb_table.ConfigNotificationSettings.stream_arn}"
#       ]
#   }
# }  
# EOF
# }
#Parameters Missing
#AlertSNSTopic
#roleInfraEnvironmentManagerAudit -> ManagedPolicy arn
#"ManagedPolicyArns": [
#    "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
#],
#Assume Role within roleInfraEnvironmentManagerAuditPolicy
# List of managed accounts for the role roleInfraEnvironmentManagerAuditWriter
#Managed policy arn for roleInfraEnvironmentManagerAuditWriter
#Managed policy for roleInfraAsgScale
###################################
# Environment Manager LB Settings #
###################################
########################################
# Environment Manager Master Resources #
########################################
# resource "aws_elb" "loadBalancerEnvironmentManager" {
#   name            = "environmentmanager-elb"
#   security_groups = ["${aws_security_group.sg_environment_managerElb.id}"]
#   subnets         = "${var.subnet_ids["private_a"]}"
#   internal        = true
#   # access_logs {
#   #   bucket        = "foo"
#   #   bucket_prefix = "bar"
#   #   interval      = 60
#   # }
#   listener {
#     instance_port     = "${var.load_balancer_em_port}"
#     instance_protocol = "http"
#     lb_port           = "${var.load_balancer_em_listener_port}"
#     lb_protocol       = "http"
#   }
#   health_check {
#     healthy_threshold   = 2
#     unhealthy_threshold = 5
#     timeout             = 3
#     target              = "HTTP:${var.load_balancer_em_port}/${var.load_balancer_em_health_check}"
#     interval            = 5
#   }
#   cross_zone_load_balancing   = true
#   idle_timeout                = "${var.load_balancer_em_timeout}"
#   connection_draining         = true
#   connection_draining_timeout = "${var.load_balancer_em_timeout}"
#   tags {
#     Name = "foobar-terraform-elb"
#   }
# }
# resource "aws_autoscaling_group" "asgEnvironmentManager" {
#   default_cooldown          = 30
#   desired_capacity          = 2
#   health_check_grace_period = 30
#   health_check_type         = "EC2"
#   launch_configuration      = "${aws_launch_configuration.launchConfigEnvironmentManager.name}"
#   load_balancers            = ["${aws_elb.loadBalancerEnvironmentManager.id}"]
#   max_size                  = 4
#   min_size                  = 0
#   tags = [
#     {
#       key                 = "Role"
#       value               = "EnvironmentManager"
#       propagate_at_launch = true
#     },
#   ]
#   vpc_zone_identifier = "${var.load_balancer_em_subnet_ids}"
# }
# Missing 
# SourceSecurityGroupId in sgiInfraEnvironmentManagerTcp40500fromsg_environment_manager_elb
# Managed policy arn for roleInfraEnvironmentManager
#############################
# Environment Manager Redis #
#############################
#################
# Redis Network #
#################
#############
# Upstreams #
#############
# resource "aws_lambda_function" "lambdaInfraEnvironmentManagerUpstreamRouter" {
#   filename         = "./lambda/InfraEnvironmentManagerUpstreamRouter/InfraEnvironmentManagerUpstreamRouter.zip"
#   function_name    = "${var.resource_prefix}InfraEnvironmentManagerUpstreamRouter"
#   role             = "${var.upstream_router_execution_role}"
#   handler          = "exports.test"
#   source_code_hash = "${base64sha256(file("./lambda/InfraEnvironmentManagerUpstreamRouter/InfraEnvironmentManagerUpstreamRouter.zip"))}"
#   runtime          = "nodejs6.10"
#   memory_size      = 128
#   timeout          = 10
#   environment {
#     variables = {
#       DESTINATION_TABLE = "${var.destination_table}"
#       ROLE_NAME         = "${var.role_name}"
#     }
#   }
# }
# resource "aws_cloudwatch_metric_alarm" "alertInfraEnvironmentManagerUpstreamRouter" {
#   alarm_name          = "${var.resource_prefix}alertInfraEnvironmentManagerUpstreamRouter"
#   actions_enabled     = true
#   alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
#   alarm_description   = "AlertReadCapacityConfigEnvironments"
#   comparison_operator = "GreaterThanThreshold"
#   dimensions = {
#     FunctionName = "lambdaInfraEnvironmentManagerUpstreamRouter"
#   }
#   evaluation_periods = "1"
#   metric_name        = "Errors"
#   namespace          = "AWS/Lambda"
#   period             = "60"
#   statistic          = "Sum"
#   threshold          = "8"
# }

