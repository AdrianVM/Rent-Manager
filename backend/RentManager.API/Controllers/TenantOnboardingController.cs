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
        private readonly IAuthService _authService;
        private readonly IDataService _dataService;

        public TenantOnboardingController(IAuthService authService, IDataService dataService)
        {
            _authService = authService;
            _dataService = dataService;
        }

        [HttpPost]
        [AllowAnonymous]
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

            if (invitation.ExpiresAt < DateTime.UtcNow)
            {
                invitation.Status = InvitationStatus.Expired;
                return BadRequest(new { message = "This invitation has expired" });
            }

            if (invitation.Email.ToLower() != request.Email.ToLower())
            {
                return BadRequest(new { message = "Email does not match invitation" });
            }

            // Register user via AuthService
            var registrationRequest = new UserRegistrationRequest
            {
                Name = request.Name,
                Email = request.Email,
                Password = request.Password,
                Role = UserRole.Renter
            };

            var user = await _authService.RegisterAsync(registrationRequest);
            if (user == null)
            {
                return BadRequest(new { message = "A user with this email already exists" });
            }

            // Create tenant record
            var tenant = new Tenant
            {
                Name = request.Name,
                Email = request.Email,
                Phone = request.Phone,
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
            invitation.UpdatedAt = DateTime.UtcNow;

            return Ok(new
            {
                message = "Tenant onboarding completed successfully",
                userId = user.Id,
                tenantId = tenant.Id,
                user = new
                {
                    id = user.Id,
                    name = user.Name,
                    email = user.Email,
                    role = user.Role.ToString()
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
