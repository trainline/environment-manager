resource "aws_default_route_table" "private" {
  default_route_table_id = "${aws_vpc.main.default_route_table_id}"

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = "${aws_nat_gateway.gw.id}"
  }

  tags {
    Name = "Private Subnets"
  }
}
