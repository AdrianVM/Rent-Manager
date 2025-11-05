# Cloudflare Infrastructure - rentflow.ro

This Terraform configuration manages Cloudflare infrastructure for rentflow.ro.

## What's Configured

- **DNS Records**: CNAME for apex and www pointing to Scaleway S3
- **URL Rewrites**: Index fallback and pretty URLs for SPA
- **Cache Rules**: Bypass for /admin & /preview, cache everything else
- **Firewall**: Block S3 listing attempts and non-GET/HEAD methods
- **CORS Headers**: Optional edge-based CORS configuration

## Prerequisites

- Terraform >= 1.6.0
- Cloudflare API Token (already configured in `~/.bashrc`)
- Zone ID (already set in `terraform.tfvars`)

## Usage

```bash
# Initialize Terraform
cd terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply

# Destroy infrastructure (careful!)
terraform destroy
```

## Files

- `versions.tf` - Terraform and provider version requirements
- `variables.tf` - Variables, provider, DNS, and cache/transform rules
- `main.tf` - Firewall and header transform rules
- `outputs.tf` - Output values
- `terraform.tfvars` - Your specific configuration (gitignored)

## Security Notes

- API token is stored in `~/.bashrc` as `CLOUDFLARE_API_TOKEN`
- `terraform.tfvars` is gitignored to prevent credential leaks
- State files are gitignored - consider using remote state for production
