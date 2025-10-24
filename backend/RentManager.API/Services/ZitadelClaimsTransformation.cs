using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;

namespace RentManager.API.Services
{
    public class ZitadelClaimsTransformation : IClaimsTransformation
    {
        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var claimsIdentity = principal.Identity as ClaimsIdentity;

            if (claimsIdentity == null || !claimsIdentity.IsAuthenticated)
            {
                return Task.FromResult(principal);
            }

            // Check if roles have already been transformed
            if (principal.HasClaim(c => c.Type == ClaimTypes.Role))
            {
                return Task.FromResult(principal);
            }

            // Get roles from Zitadel custom claims
            // Zitadel can use different claim names depending on configuration
            var roleClaims = new List<string>();

            // Try different Zitadel role claim formats
            var roleClaimTypes = new[]
            {
                "urn:zitadel:iam:org:project:roles",
                "urn:zitadel:iam:org:project:343076558480623989:roles",
                "roles"
            };

            foreach (var roleClaimType in roleClaimTypes)
            {
                var claim = principal.FindFirst(roleClaimType);
                if (claim != null)
                {
                    // The claim value might be a JSON object like {"admin": {...}, "property-owner": {...}}
                    // or a simple string array
                    try
                    {
                        // Try to parse as JSON
                        var rolesDict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(claim.Value);
                        if (rolesDict != null)
                        {
                            roleClaims.AddRange(rolesDict.Keys);
                        }
                    }
                    catch
                    {
                        // If it's not JSON, treat it as a simple string
                        roleClaims.Add(claim.Value);
                    }
                }

                // Also check for multiple claims with the same type
                var claims = principal.FindAll(roleClaimType);
                foreach (var c in claims)
                {
                    if (!roleClaims.Contains(c.Value))
                    {
                        roleClaims.Add(c.Value);
                    }
                }
            }

            // Map Zitadel roles to application roles and add as standard role claims
            var mappedRoles = new HashSet<string>();

            foreach (var role in roleClaims)
            {
                var normalizedRole = role.ToLowerInvariant().Trim();

                if (normalizedRole == "admin")
                {
                    mappedRoles.Add("Admin");
                }
                else if (normalizedRole == "property-owner" || normalizedRole == "propertyowner")
                {
                    mappedRoles.Add("PropertyOwner");
                }
                else if (normalizedRole == "tenant" || normalizedRole == "renter")
                {
                    mappedRoles.Add("Renter");
                }
            }

            // If no roles found, default to Renter
            if (mappedRoles.Count == 0)
            {
                mappedRoles.Add("Renter");
            }

            // Add the mapped roles as standard role claims
            foreach (var role in mappedRoles)
            {
                claimsIdentity.AddClaim(new Claim(ClaimTypes.Role, role));
            }

            return Task.FromResult(principal);
        }
    }
}
