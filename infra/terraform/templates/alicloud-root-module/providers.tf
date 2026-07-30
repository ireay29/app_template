provider "alicloud" {
  # Authentication is resolved from the shared profile or short-lived
  # environment credentials. Never put access keys in this file.
  profile = var.profile
  region  = var.region
}
