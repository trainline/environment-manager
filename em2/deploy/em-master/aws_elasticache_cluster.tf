resource "aws_elasticache_cluster" "cache-cluster" {
  cluster_id = "${var.stack}"
  node_type  = "cache.t2.micro"

  subnet_group_name  = "${var.redis_subnet_group}"
  engine             = "redis"
  num_cache_nodes    = 1
  port               = 11211
  security_group_ids = ["${var.default_sg}"]
}
