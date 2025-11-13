using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;
using RentManager.API.Services.Email;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TenantOnboardingController : ControllerBase
    {
        private readonly IDataService _dataService;
        private readonly IBackgroundEmailService _backgroundEmailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<TenantOnboardingController> _logger;

        public TenantOnboardingController(
            IDataService dataService,
            IBackgroundEmailService backgroundEmailService,
            IConfiguration configuration,
            ILogger<TenantOnboardingController> logger)
        {
            _dataService = dataService;
            _backgroundEmailService = backgroundEmailService;
            _configuration = configuration;
            _logger = logger;
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

            // Send welcome email to the new tenant
            await SendWelcomeEmailAsync(tenant, invitation);

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

        private async Task SendWelcomeEmailAsync(Tenant tenant, TenantInvitation invitation)
        {
            try
            {
                // Get property details
                var property = await _dataService.GetPropertyAsync(tenant.PropertyId);
                if (property == null)
                {
                    _logger.LogWarning("Cannot send welcome email: Property not found for tenant {TenantId}", tenant.Id);
                    return;
                }

                // Get tenant person details
                var tenantPerson = !string.IsNullOrEmpty(tenant.PersonId)
                    ? await _dataService.GetPersonAsync(tenant.PersonId)
                    : null;

                // Get property owner details
                var propertyOwner = await _dataService.GetPropertyOwnerByPropertyIdAsync(property.Id);
                var ownerPerson = propertyOwner?.PersonOwners?.FirstOrDefault();
                var ownerUser = ownerPerson != null
                    ? await _dataService.GetUserByPersonIdAsync(ownerPerson.Id)
                    : null;

                // Prepare email data
                var emailData = new WelcomeEmailData
                {
                    TenantFirstName = tenantPerson?.FirstName ?? tenant.Email.Split('@')[0],
                    TenantEmail = tenant.Email,
                    PropertyAddress = property.Address,
                    OwnerName = ownerPerson != null ? $"{ownerPerson.FirstName} {ownerPerson.LastName}" : "Property Owner",
                    OwnerEmail = ownerUser?.Email ?? "support@rentflow.ro",
                    OwnerPhone = ownerPerson?.Phone,
                    FrontendUrl = _configuration["FrontendUrl"] ?? "https://rentflow.ro"
                };

                // Enqueue email in background
                var subject = $"Welcome to Rent Manager, {emailData.TenantFirstName}! Your Tenant Portal is Ready";
                var emailJobId = _backgroundEmailService.EnqueueWelcomeEmail(emailData, subject);

                _logger.LogInformation("Welcome email enqueued (JobId: {JobId}) for new tenant {TenantId} at {Email}",
                    emailJobId, tenant.Id, tenant.Email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email to tenant {TenantId}", tenant.Id);
                // Don't throw - email failure shouldn't break onboarding
            }
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
