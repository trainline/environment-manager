resource "aws_vpc" "main" {
  cidr_block = "${var.vpc_cidr}"
}

resource "aws_egress_only_internet_gateway" "ig" {
  vpc_id = "${aws_vpc.main.id}"
}
