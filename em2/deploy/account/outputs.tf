output "Subnet ELB A" {
  value = "{${aws_subnet.elb_a.id}}"
}

output "Subnet ELB B" {
  value = "{${aws_subnet.elb_b.id}}"
}

output "Subnet ELB C" {
  value = "{${aws_subnet.elb_c.id}}"
}

output "Subnet Public A" {
  value = "{${aws_subnet.public_a.id}}"
}

output "Subnet Public B" {
  value = "{${aws_subnet.public_b.id}}"
}

output "Subnet Public C" {
  value = "{${aws_subnet.public_c.id}}"
}

output "Subnet Private A" {
  value = "{${aws_subnet.private_a.id}}"
}

output "Subnet Private B" {
  value = "{${aws_subnet.private_b.id}}"
}

output "Subnet Private C" {
  value = "{${aws_subnet.private_c.id}}"
}
