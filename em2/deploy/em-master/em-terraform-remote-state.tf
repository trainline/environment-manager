# Write the remote state
terraform {
  backend "s3" {
    bucket = "daveandjake-remote-state"
    key    = "dave"
    region = "eu-west-1"
  }
}
