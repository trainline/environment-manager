data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "image-id"
    values = ["ami-a8d2d7ce"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
