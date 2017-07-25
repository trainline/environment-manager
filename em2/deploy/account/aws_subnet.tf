resource "aws_subnet" "public_a" {
  vpc_id            = "${aws_vpc.main.id}"
  availability_zone = "${var.subnet_availability_zones["a"]}"
  cidr_block        = "${var.subnet_cidr["public_a"]}"

  tags {
    Name = "Public A"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id            = "${aws_vpc.main.id}"
  availability_zone = "${var.subnet_availability_zones["b"]}"
  cidr_block        = "${var.subnet_cidr["public_b"]}"

  tags {
    Name = "Public B"
  }
}

resource "aws_subnet" "public_c" {
  vpc_id            = "${aws_vpc.main.id}"
  availability_zone = "${var.subnet_availability_zones["c"]}"
  cidr_block        = "${var.subnet_cidr["public_c"]}"

  tags {
    Name = "Public C"
  }
}

resource "aws_subnet" "private_a" {
  vpc_id            = "${aws_vpc.main.id}"
  availability_zone = "${var.subnet_availability_zones["a"]}"
  cidr_block        = "${var.subnet_cidr["private_a"]}"

  tags {
    Name = "Private A"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = "${aws_vpc.main.id}"
  availability_zone = "${var.subnet_availability_zones["b"]}"

  cidr_block = "${var.subnet_cidr["private_b"]}"

  tags {
    Name = "Private B"
  }
}

resource "aws_subnet" "private_c" {
  vpc_id            = "${aws_vpc.main.id}"
  availability_zone = "${var.subnet_availability_zones["c"]}"

  cidr_block = "${var.subnet_cidr["private_c"]}"

  tags {
    Name = "Private C"
  }
}
