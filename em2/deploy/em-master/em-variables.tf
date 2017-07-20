# App

variable "stack" {}

variable "app" {}

variable "is_production" {}

variable "packages_key_prefix" {}

# Buckets

variable "packages_bucket" {}

variable "deployment_bucket" {}

variable "secure_bucket" {}

variable "backups_bucket" {}

variable "configuration_bucket" {}

variable "deployment_logs_bucket" {}

variable "init_script_bucket" {}

# Scheduler

variable scheduler_package {}

variable scheduler_env_vars {
  type = "map"
}

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

variable "app_sg_cidr_inbound" {
  type = "list"
}

variable "app_sg_cidr_outbound" {
  type = "list"
}

# Account

variable "vpc_id" {}

variable "subnet_ids" {
  type = "map"
}
