resource "aws_iam_instance_profile" "app" {
  name = "${var.stack}-${var.app}-app"
  role = "${aws_iam_role.app.name}"
  path = "/${var.app}/"
}
