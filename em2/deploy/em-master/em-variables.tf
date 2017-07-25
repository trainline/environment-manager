# App

variable "stack" {}

# Buckets

variable "bucket" {}

variable "secure_bucket" {}

variable "init_script_bucket" {}

# Scheduler

variable scheduler_package {}

variable scheduler_env_vars {
  type = "map"
}

# Redis

variable "redis_subnet_group" {}

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
