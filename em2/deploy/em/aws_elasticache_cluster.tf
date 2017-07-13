resource "aws_elasticache_cluster" "redisEnvironmentManager" {
  cluster_id = "em-cache-cluster"
  node_type  = "cache.t2.micro"

  subnet_group_name  = "${aws_elasticache_subnet_group.redis_subnet_group.name}"
  engine             = "redis"
  num_cache_nodes    = 1
  port               = "${var.redis_port}"
  security_group_ids = ["${var.default_sg}"]

  tags = {
    Role = "EnvironmentManager"
  }

  # security_group_ids = "${var.redis_security_group_ids}"
}
