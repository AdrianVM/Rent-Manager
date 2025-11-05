output "apex_cname_target" {
  value       = cloudflare_dns_record.apex_cname.content
  description = "Apex CNAME target"
}

output "www_points_to" {
  value       = cloudflare_dns_record.www_cname.content
  description = "www CNAME target"
}
