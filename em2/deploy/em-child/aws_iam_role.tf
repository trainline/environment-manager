resource "aws_iam_instance_profile" "instance_profile" {
  name = "${var.stack}-default-instance-profile"
  role = "${aws_iam_role.app.name}"
}

resource "aws_iam_role" "app" {
  name = "role-${var.stack}-child"

  assume_role_policy = <<EOF
{
   "Version":"2012-10-17",
   "Statement":[
      {
         "Effect":"Allow",
         "Principal":{
            "Service":"ec2.amazonaws.com"
         },
         "Action":"sts:AssumeRole"
      },
      {
        "Action": "sts:AssumeRole",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Effect": "Allow"
      },
      {
        "Effect": "Allow",
        "Principal": {
          "AWS": "arn:aws:iam::${var.master_account}:root"
        },
        "Action": "sts:AssumeRole"
      }
   ]
}
EOF
}
