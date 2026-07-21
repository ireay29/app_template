output "stack_name" {
  description = "Logical name of this root module stack."
  value       = local.stack_name
}

output "provider_source" {
  description = "Terraform Registry source for the provider used by this stack."
  value       = "aliyun/alicloud"
}
