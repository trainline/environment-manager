resource "aws_elasticache_cluster" "cache-cluster" {
  cluster_id = "${var.stack}-${var.app}-cache-cluster"
  node_type  = "cache.t2.micro"

  subnet_group_name  = "${var.redis_subnet_group}"
  engine             = "redis"
  num_cache_nodes    = 1
  port               = "${var.redis_port}"
  security_group_ids = ["${var.default_sg}"]

  tags = {
    Role = "${var.app}"
  }
}
