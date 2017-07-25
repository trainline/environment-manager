resource "aws_autoscaling_group" "app" {
  vpc_zone_identifier       = ["${var.subnet_ids["private_a"]}", "${var.subnet_ids["private_b"]}", "${var.subnet_ids["private_c"]}"]
  name                      = "${var.stack}-${var.app}"
  max_size                  = 5
  min_size                  = 0
  health_check_grace_period = 30
  health_check_type         = "ELB"
  desired_capacity          = 2
  force_delete              = true
  launch_configuration      = "${aws_launch_configuration.app.name}"
  load_balancers            = ["${aws_elb.app.name}"]
}

data "template_file" "user_data" {
  template = "${file("${path.module}/scripts/app/user-data.tpl")}"

  vars {
    region              = "${data.aws_region.current.name}"
    resource_prefix     = "${var.stack}-${var.app}-"
    secure_bucket       = "${var.secure_bucket}"
    config_key          = "${var.configuration_key}"
    packages_bucket     = "${var.packages_bucket}"
    packages_key_prefix = "${var.packages_key_prefix}"
    redis_address       = "${aws_elasticache_cluster.cache-cluster.cache_nodes.0.address}"
    redis_port          = "${var.redis_port}"
    redis_key_key       = "${var.redis_crypto_key}"
  }
}

resource "aws_launch_configuration" "app" {
  name_prefix          = "${var.stack}-${var.app}-"
  image_id             = "${data.aws_ami.ubuntu.id}"
  instance_type        = "t2.micro"
  key_name             = "em-testing-master-keypair-2"
  iam_instance_profile = "${aws_iam_instance_profile.app.id}"
  user_data            = "${data.template_file.user_data.rendered}"
  security_groups      = ["${aws_security_group.app.id}"]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_elb" "app" {
  name    = "${var.stack}-${var.app}"
  subnets = ["${var.subnet_ids["public_a"]}", "${var.subnet_ids["public_b"]}", "${var.subnet_ids["public_c"]}"]

  listener {
    instance_port     = 8080
    instance_protocol = "http"
    lb_port           = 80
    lb_protocol       = "http"

    # lb_protocol       = "https"
    # ssl_certificate_id = "arn:aws:iam::123456789012:server-certificate/certName"
  }

  security_groups = ["${aws_security_group.elb.id}"]

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 5
    timeout             = 3
    target              = "HTTP:8080/api/v1/diagnostics/healthcheck"
    interval            = 10
  }

  cross_zone_load_balancing = true

  tags {
    Name = "${var.stack}-${var.app}"
  }
}
