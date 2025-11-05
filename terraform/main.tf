# ---------- Firewall Hardening ----------
resource "cloudflare_ruleset" "firewall_custom" {
  zone_id     = local.zone_id
  name        = "rentflow.ro — firewall"
  description = "Block S3 listing attempts & non-GET/HEAD"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules = [
    {
      enabled     = true
      description = "Block S3 listing attempts and non-GET/HEAD methods"
      expression  = "(${local.host_expr}) and ((lower(http.request.uri.query) contains \"list-type\" or lower(http.request.uri.query) contains \"prefix\") or not (http.request.method in {\"GET\" \"HEAD\"}))"
      action      = "block"
    }
  ]
}

# ---------- Optional: Request Header Transform (force Origin) ----------
resource "cloudflare_ruleset" "request_headers" {
  count       = var.enable_request_origin_header ? 1 : 0
  zone_id     = local.zone_id
  name        = "rentflow.ro — request header transforms"
  description = "Force Origin header to strict site origin"
  kind        = "zone"
  phase       = "http_request_late_transform"

  rules = [
    {
      enabled     = true
      description = "Force Origin header to https://${local.host}"
      expression  = "(${local.host_expr})"
      action      = "rewrite"

      action_parameters = {
        headers = {
          Origin = {
            operation = "set"
            value     = "https://${local.host}"
          }
        }
      }
    }
  ]
}

# ---------- Optional: Response Header Transform (CORS) ----------
resource "cloudflare_ruleset" "response_headers" {
  count       = var.enable_cors_response_headers ? 1 : 0
  zone_id     = local.zone_id
  name        = "rentflow.ro — response header transforms"
  description = "Add CORS headers at edge"
  kind        = "zone"
  phase       = "http_response_headers_transform"

  rules = [
    {
      enabled     = true
      description = "Add CORS response headers for site"
      expression  = "(${local.host_expr})"
      action      = "rewrite"

      action_parameters = {
        headers = {
          Access-Control-Allow-Origin = {
            operation = "set"
            value     = "https://${local.host}"
          }
          Access-Control-Allow-Methods = {
            operation = "set"
            value     = "GET, HEAD, OPTIONS"
          }
          Access-Control-Allow-Headers = {
            operation = "set"
            value     = "Content-Type, Authorization, Range"
          }
          Access-Control-Expose-Headers = {
            operation = "set"
            value     = "Content-Length, Content-Range"
          }
        }
      }
    }
  ]
}
