variable "region" {
  description = "Alibaba Cloud region for this stack."
  type        = string
  default     = "cn-hangzhou"
}

variable "profile" {
  description = "Optional Alibaba Cloud shared profile name."
  type        = string
  default     = null
  nullable    = true
}
