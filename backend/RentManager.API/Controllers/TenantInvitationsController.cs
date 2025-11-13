using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;
using RentManager.API.Services.Email;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TenantInvitationsController : ControllerBase
    {
        private static readonly List<TenantInvitation> _invitations = new();
        private readonly IConfiguration _configuration;
        private readonly IDataService _dataService;
        private readonly IBackgroundEmailService _backgroundEmailService;
        private readonly ILogger<TenantInvitationsController> _logger;

        public TenantInvitationsController(
            IConfiguration configuration,
            IDataService dataService,
            IBackgroundEmailService backgroundEmailService,
            ILogger<TenantInvitationsController> logger)
        {
            _configuration = configuration;
            _dataService = dataService;
            _backgroundEmailService = backgroundEmailService;
            _logger = logger;
        }

        // Property owners and admins can create invitations
        [HttpPost]
        [Authorize(Roles = "Admin,PropertyOwner")]
        public async Task<IActionResult> CreateInvitation([FromBody] CreateInvitationRequest request)
        {
            try
            {
                // Fetch property details
                var property = await _dataService.GetPropertyAsync(request.PropertyId);
                if (property == null)
                {
                    return NotFound(new { message = "Property not found" });
                }

                // Get current user info for owner details
                var userId = User.FindFirst("sub")?.Value ?? User.Identity?.Name;
                var ownerName = User.FindFirst("name")?.Value ?? "Property Owner";
                var ownerEmail = User.FindFirst("email")?.Value ?? _configuration["ScalewayEmail:DefaultFromEmail"] ?? "noreply@rentflow.ro";

                var invitation = new TenantInvitation
                {
                    PropertyId = request.PropertyId,
                    Email = request.Email,
                    RentAmount = request.RentAmount,
                    LeaseStart = request.LeaseStart,
                    LeaseEnd = request.LeaseEnd,
                    Deposit = request.Deposit,
                    InvitedByUserId = userId
                };

                _invitations.Add(invitation);

                // Get frontend URL from configuration
                var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
                var invitationLink = $"{frontendUrl}/onboard?token={invitation.InvitationToken}";

                // Extract tenant first name from email (before @)
                var tenantFirstName = request.Email.Split('@')[0];

                // Format property type for display
                var propertyTypeDisplay = property.Type.ToString();
                if (property.Type == PropertyType.Apartment && property.Bedrooms.HasValue)
                {
                    propertyTypeDisplay = $"{property.Bedrooms} Bedroom Apartment";
                }
                else if (property.Type == PropertyType.House && property.Bedrooms.HasValue)
                {
                    propertyTypeDisplay = $"{property.Bedrooms} Bedroom House";
                }

                // Prepare email data
                var emailData = new TenantInvitationEmailData
                {
                    TenantFirstName = tenantFirstName,
                    TenantEmail = request.Email,
                    OwnerName = ownerName,
                    OwnerEmail = ownerEmail,
                    PropertyName = property.Name,
                    PropertyAddress = property.Address,
                    PropertyType = propertyTypeDisplay,
                    RentAmount = request.RentAmount ?? property.RentAmount,
                    LeaseStartDate = request.LeaseStart?.ToString("dd.MM.yyyy") ?? "To be determined",
                    OnboardingUrl = invitationLink,
                    ExpirationDate = invitation.ExpiresAt.ToString("dd.MM.yyyy"),
                    FrontendUrl = frontendUrl
                };

                // Enqueue email in background
                var emailSubject = $"You're invited to {property.Name} - Complete Your Tenant Onboarding";
                var emailJobId = _backgroundEmailService.EnqueueTenantInvitationEmail(emailData, emailSubject);

                _logger.LogInformation("Tenant invitation email enqueued (JobId: {JobId}) for {Email} and property {PropertyId}", emailJobId, request.Email, request.PropertyId);

                return Ok(new
                {
                    id = invitation.Id,
                    invitationToken = invitation.InvitationToken,
                    invitationLink = invitationLink,
                    email = invitation.Email,
                    expiresAt = invitation.ExpiresAt,
                    status = invitation.Status.ToString(),
                    emailSent = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating invitation and sending email for property {PropertyId}", request.PropertyId);
                return StatusCode(500, new { message = "Failed to create invitation", error = ex.Message });
            }
        }

        // Get all invitations (property owners and admins)
        [HttpGet]
        [Authorize(Roles = "Admin,PropertyOwner")]
        public IActionResult GetInvitations()
        {
            return Ok(_invitations.Select(i => new
            {
                id = i.Id,
                propertyId = i.PropertyId,
                email = i.Email,
                status = i.Status.ToString(),
                createdAt = i.CreatedAt,
                expiresAt = i.ExpiresAt,
                invitationToken = i.InvitationToken
            }));
        }

        // Get invitation by token (public - no auth required)
        [HttpGet("token/{token}")]
        [AllowAnonymous]
        public IActionResult GetInvitationByToken(string token)
        {
            var invitation = _invitations.FirstOrDefault(i => i.InvitationToken == token);

            if (invitation == null)
            {
                return NotFound(new { message = "Invitation not found" });
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

            // Don't return sensitive information
            return Ok(new
            {
                email = invitation.Email,
                propertyId = invitation.PropertyId,
                rentAmount = invitation.RentAmount,
                leaseStart = invitation.LeaseStart,
                leaseEnd = invitation.LeaseEnd,
                deposit = invitation.Deposit,
                expiresAt = invitation.ExpiresAt
            });
        }

        // Cancel invitation
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,PropertyOwner")]
        public IActionResult CancelInvitation(string id)
        {
            var invitation = _invitations.FirstOrDefault(i => i.Id == id);

            if (invitation == null)
            {
                return NotFound(new { message = "Invitation not found" });
            }

            invitation.Status = InvitationStatus.Cancelled;
            invitation.UpdatedAt = DateTimeOffset.UtcNow;

            return Ok(new { message = "Invitation cancelled successfully" });
        }

        // Resend invitation
        [HttpPost("{id}/resend")]
        [Authorize(Roles = "Admin,PropertyOwner")]
        public async Task<IActionResult> ResendInvitation(string id)
        {
            try
            {
                var invitation = _invitations.FirstOrDefault(i => i.Id == id);

                if (invitation == null)
                {
                    return NotFound(new { message = "Invitation not found" });
                }

                // Fetch property details
                var property = await _dataService.GetPropertyAsync(invitation.PropertyId);
                if (property == null)
                {
                    return NotFound(new { message = "Property not found" });
                }

                // Get current user info for owner details
                var ownerName = User.FindFirst("name")?.Value ?? "Property Owner";
                var ownerEmail = User.FindFirst("email")?.Value ?? _configuration["ScalewayEmail:DefaultFromEmail"] ?? "noreply@rentflow.ro";

                // Generate new token and extend expiration
                invitation.InvitationToken = Guid.NewGuid().ToString();
                invitation.ExpiresAt = DateTimeOffset.UtcNow.AddDays(7);
                invitation.Status = InvitationStatus.Pending;
                invitation.UpdatedAt = DateTimeOffset.UtcNow;

                // Get frontend URL from configuration
                var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
                var invitationLink = $"{frontendUrl}/onboard?token={invitation.InvitationToken}";

                // Extract tenant first name from email
                var tenantFirstName = invitation.Email.Split('@')[0];

                // Format property type for display
                var propertyTypeDisplay = property.Type.ToString();
                if (property.Type == PropertyType.Apartment && property.Bedrooms.HasValue)
                {
                    propertyTypeDisplay = $"{property.Bedrooms} Bedroom Apartment";
                }
                else if (property.Type == PropertyType.House && property.Bedrooms.HasValue)
                {
                    propertyTypeDisplay = $"{property.Bedrooms} Bedroom House";
                }

                // Prepare email data
                var emailData = new TenantInvitationEmailData
                {
                    TenantFirstName = tenantFirstName,
                    TenantEmail = invitation.Email,
                    OwnerName = ownerName,
                    OwnerEmail = ownerEmail,
                    PropertyName = property.Name,
                    PropertyAddress = property.Address,
                    PropertyType = propertyTypeDisplay,
                    RentAmount = invitation.RentAmount ?? property.RentAmount,
                    LeaseStartDate = invitation.LeaseStart?.ToString("dd.MM.yyyy") ?? "To be determined",
                    OnboardingUrl = invitationLink,
                    ExpirationDate = invitation.ExpiresAt.ToString("dd.MM.yyyy"),
                    FrontendUrl = frontendUrl
                };

                // Enqueue email in background with "Reminder" in subject
                var emailSubject = $"Reminder: You're invited to {property.Name} - Complete Your Tenant Onboarding";
                var emailJobId = _backgroundEmailService.EnqueueTenantInvitationEmail(emailData, emailSubject);

                _logger.LogInformation("Tenant invitation reminder email enqueued (JobId: {JobId}) for {Email} and property {PropertyId}", emailJobId, invitation.Email, invitation.PropertyId);

                return Ok(new
                {
                    id = invitation.Id,
                    invitationToken = invitation.InvitationToken,
                    invitationLink = invitationLink,
                    expiresAt = invitation.ExpiresAt,
                    emailSent = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resending invitation email for invitation {InvitationId}", id);
                return StatusCode(500, new { message = "Failed to resend invitation", error = ex.Message });
            }
        }

        // Internal method to get invitations list for testing
        public static List<TenantInvitation> GetInvitationsList() => _invitations;
    }
}
