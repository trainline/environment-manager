resource "aws_route_table" "r" {
  vpc_id = "${aws_vpc.main.id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${aws_internet_gateway.main.id}"
  }

  route {
    cidr_block = "172.31.0.0/16"
  }

  tags {
    Name = "main"
  }
}

resource "aws_route_table_association" "a" {
  subnet_id      = "${aws_subnet.public_a.id}"
  route_table_id = "${aws_route_table.r.id}"
}

resource "aws_route_table_association" "a" {
  subnet_id      = "${aws_subnet.public_b.id}"
  route_table_id = "${aws_route_table.r.id}"
}

resource "aws_route_table_association" "a" {
  subnet_id      = "${aws_subnet.public_c.id}"
  route_table_id = "${aws_route_table.r.id}"
}
