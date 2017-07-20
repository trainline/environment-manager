# App

variable "stack" {}

variable "app" {}

variable "is_production" {}

variable "packages_key_prefix" {}

# Scheduler

variable scheduler_package {}

variable scheduler_env_vars {}

variable scheduler_kms_key_arn {}

# Redis

variable "redis_subnet_group" {}

variable "redis_address" {}

variable "redis_crypto_key" {}

variable "redis_port" {}

# Load Balancer

variable "load_balancer_em_timeout" {}

variable "load_balancer_em_port" {}

# Security Groups

variable "default_sg" {}

variable "app_sg_cidr_inbound" {}

variable "app_sg_cidr_outbound" {}

# Account

variable "vpc_id" {}

variable "subnet_ids" {}

# Terraform

variable "remote_state_bucket_name" {}

variable "remote_state_key" {}
