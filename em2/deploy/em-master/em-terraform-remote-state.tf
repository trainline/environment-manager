# Write the remote state
terraform {
  backend "s3" {
    bucket = "newco-remote-state-master"
    key    = "demo"
    region = "eu-west-1"
  }
}
