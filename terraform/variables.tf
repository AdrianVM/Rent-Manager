variable "zone_id" {
  description = "Cloudflare Zone ID for rentflow.ro"
  type        = string
}

variable "domain" {
  description = "Apex domain"
  type        = string
  default     = "rentflow.ro"
}

variable "enable_request_origin_header" {
  description = "Force Origin header on requests to origin"
  type        = bool
  default     = true
}

variable "enable_cors_response_headers" {
  description = "Add CORS headers on responses at the edge"
  type        = bool
  default     = true
}

variable "edge_ttl_seconds" {
  description = "Edge cache TTL for Cache Everything"
  type        = number
  default     = 86400
}

provider "cloudflare" {
  # Auth via CLOUDFLARE_API_TOKEN env var
}

locals {
  zone_id   = var.zone_id
  host      = var.domain
  www_host  = "www.${var.domain}"
  host_expr = "http.host in { \"${local.host}\" \"${local.www_host}\" }"
  s3_api    = "${var.domain}.s3-website.fr-par.scw.cloud"
}

# ---------- DNS (proxied CNAMEs to S3 API endpoint) ----------
resource "cloudflare_dns_record" "apex_cname" {
  zone_id = local.zone_id
  name    = local.host
  type    = "CNAME"
  content = local.s3_api
  ttl     = 1
  proxied = true
  comment = "Apex → Scaleway S3 API endpoint (proxied)"
}

resource "cloudflare_dns_record" "www_cname" {
  zone_id = local.zone_id
  name    = "www"
  type    = "CNAME"
  content = local.host
  ttl     = 1
  proxied = true
  comment = "www → apex (proxied)"
}

# ---------- Page Rules (Free plan alternative to Transform/Cache Rules) ----------
# Note: Free plan allows 3 page rules. S3 website hosting handles index.html rewrites.

resource "cloudflare_page_rule" "cache_everything" {
  zone_id  = local.zone_id
  target   = "${local.host}/*"
  priority = 1

  actions {
    cache_level = "cache_everything"
    edge_cache_ttl = var.edge_ttl_seconds
  }
}

resource "cloudflare_page_rule" "bypass_admin_cache" {
  zone_id  = local.zone_id
  target   = "${local.host}/admin*"
  priority = 2

  actions {
    cache_level = "bypass"
  }
}

resource "cloudflare_page_rule" "bypass_preview_cache" {
  zone_id  = local.zone_id
  target   = "${local.host}/preview*"
  priority = 3

  actions {
    cache_level = "bypass"
  }
}
