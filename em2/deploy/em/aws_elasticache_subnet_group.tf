resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "redis-subnet-group"
  subnet_ids = ["${var.subnet_ids["private_a"]}", "${var.subnet_ids["private_b"]}", "${var.subnet_ids["private_c"]}"]
}
