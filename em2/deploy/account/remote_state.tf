# Write the remote state
terraform {
  backend "s3" {
    bucket = "terraform-em-remote-state"
    key    = "account"
    region = "eu-west-1"
  }
}

# Use the remote state
data "terraform_remote_state" "remote_state" {
  backend = "s3"

  config {
    bucket = "terraform-em-remote-state"
    key    = "account"
  }
}
