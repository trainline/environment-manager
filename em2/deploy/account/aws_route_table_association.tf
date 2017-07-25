resource "aws_route_table_association" "a" {
  subnet_id      = "${aws_subnet.public_a.id}"
  route_table_id = "${aws_default_route_table.r.id}"
}

resource "aws_route_table_association" "b" {
  subnet_id      = "${aws_subnet.public_b.id}"
  route_table_id = "${aws_default_route_table.r.id}"
}

resource "aws_route_table_association" "c" {
  subnet_id      = "${aws_subnet.public_c.id}"
  route_table_id = "${aws_default_route_table.r.id}"
}

resource "aws_route_table_association" "a_priv" {
  subnet_id      = "${aws_subnet.private_a.id}"
  route_table_id = "${aws_route_table.r.id}"
}

resource "aws_route_table_association" "b_priv" {
  subnet_id      = "${aws_subnet.private_b.id}"
  route_table_id = "${aws_route_table.r.id}"
}

resource "aws_route_table_association" "c_priv" {
  subnet_id      = "${aws_subnet.private_c.id}"
  route_table_id = "${aws_route_table.r.id}"
}
