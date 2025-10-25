using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TenantOnboardingController : ControllerBase
    {
        private readonly IDataService _dataService;

        public TenantOnboardingController(IDataService dataService)
        {
            _dataService = dataService;
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> OnboardTenant([FromBody] TenantOnboardingRequest request)
        {
            // Find the invitation
            var invitations = TenantInvitationsController.GetInvitationsList();
            var invitation = invitations.FirstOrDefault(i => i.InvitationToken == request.InvitationToken);

            if (invitation == null)
            {
                return NotFound(new { message = "Invalid invitation token" });
            }

            if (invitation.Status != InvitationStatus.Pending)
            {
                return BadRequest(new { message = $"This invitation has already been {invitation.Status.ToString().ToLower()}" });
            }

            if (invitation.ExpiresAt < DateTimeOffset.UtcNow)
            {
                invitation.Status = InvitationStatus.Expired;
                return BadRequest(new { message = "This invitation has expired" });
            }

            if (invitation.Email.ToLower() != request.Email.ToLower())
            {
                return BadRequest(new { message = "Email does not match invitation" });
            }

            // Get the authenticated user's ID from Zitadel token
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Create Person entity for the tenant
            var nameParts = request.Name.Split(' ', 2);
            var firstName = nameParts[0];
            var lastName = nameParts.Length > 1 ? nameParts[1] : "";

            var person = await _dataService.CreatePersonAsync(new Person
            {
                FirstName = firstName,
                LastName = lastName
            });

            // Create tenant record
            var tenant = new Tenant
            {
                TenantType = TenantType.Person,
                Email = request.Email,
                Phone = request.Phone,
                PersonId = person.Id,
                PropertyId = invitation.PropertyId,
                RentAmount = invitation.RentAmount ?? 0,
                LeaseStart = invitation.LeaseStart,
                LeaseEnd = invitation.LeaseEnd,
                Deposit = invitation.Deposit,
                Status = TenantStatus.Active
            };

            tenant = await _dataService.CreateTenantAsync(tenant);

            // Mark invitation as accepted
            invitation.Status = InvitationStatus.Accepted;
            invitation.UpdatedAt = DateTimeOffset.UtcNow;

            return Ok(new
            {
                message = "Tenant onboarding completed successfully",
                userId = userId,
                tenantId = tenant.Id,
                tenant = new
                {
                    id = tenant.Id,
                    email = tenant.Email,
                    propertyId = tenant.PropertyId
                }
            });
        }

        // Get property details for onboarding (public)
        [HttpGet("property/{propertyId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPropertyForOnboarding(string propertyId)
        {
            var property = await _dataService.GetPropertyAsync(propertyId);

            if (property == null)
            {
                return NotFound(new { message = "Property not found" });
            }

            return Ok(new
            {
                id = property.Id,
                name = property.Name,
                address = property.Address,
                type = property.Type.ToString(),
                bedrooms = property.Bedrooms,
                bathrooms = property.Bathrooms,
                squareFootage = property.SquareFootage,
                description = property.Description
            });
        }
    }
}
