# Write the remote state
terraform {
  backend "s3" {
    bucket = "em-terraform-remote-state"
    key    = "${var.stack}"
    region = "eu-west-1"
  }
}

# Use the remote state
data "terraform_remote_state" "remote_state" {
  backend = "s3"

  config {
    bucket = "em-terraform-remote-state"
    key    = "${var.stack}"
  }
}
