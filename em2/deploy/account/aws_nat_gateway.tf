resource "aws_nat_gateway" "gw" {
  allocation_id = "${aws_eip.nat.id}"
  subnet_id     = "${aws_subnet.public_a.id}"
}

resource "aws_eip" "nat" {
  vpc = true
}
