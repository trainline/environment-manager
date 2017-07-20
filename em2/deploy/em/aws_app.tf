resource "aws_autoscaling_group" "app" {
  vpc_zone_identifier       = ["${var.subnet_ids["private_a"]}", "${var.subnet_ids["private_b"]}", "${var.subnet_ids["private_c"]}"]
  name                      = "${var.stack}-${var.app}"
  max_size                  = 5
  min_size                  = 2
  health_check_grace_period = 30
  health_check_type         = "ELB"
  desired_capacity          = 2
  force_delete              = true
  launch_configuration      = "${aws_launch_configuration.app.name}"
  load_balancers            = ["${aws_elb.app.name}"]
}

resource "aws_launch_configuration" "app" {
  name_prefix          = "${var.stack}-${var.app}-"
  image_id             = "${data.aws_ami.ubuntu.id}"
  instance_type        = "t2.micro"
  key_name             = "em-testing-master-keypair-2"
  iam_instance_profile = "${aws_iam_instance_profile.app.id}"
  user_data            = "${file("${path.module}/scripts/app/user-data.sh")}"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_elb" "app" {
  name    = "${var.stack}-${var.app}"
  subnets = ["${var.subnet_ids["private_a"]}", "${var.subnet_ids["private_b"]}", "${var.subnet_ids["private_c"]}"]

  # access_logs {
  #   bucket        = "foo"
  #   bucket_prefix = "bar"
  #   interval      = 60
  # }

  listener {
    instance_port     = 8080
    instance_protocol = "http"
    lb_port           = 80
    lb_protocol       = "http"

    # lb_protocol       = "https"
    # ssl_certificate_id = "arn:aws:iam::123456789012:server-certificate/certName"
  }
  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 5
    timeout             = 3
    target              = "HTTP:8080/api/v1/diagnostics/healthcheck"
    interval            = 10
  }
  cross_zone_load_balancing   = true
  idle_timeout                = 60
  connection_draining         = true
  connection_draining_timeout = 60
  tags {
    Name = "${var.stack}-${var.app}"
  }
}
