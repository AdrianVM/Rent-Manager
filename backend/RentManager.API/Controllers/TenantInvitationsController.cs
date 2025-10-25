using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TenantInvitationsController : ControllerBase
    {
        private static readonly List<TenantInvitation> _invitations = new();
        private readonly IConfiguration _configuration;

        public TenantInvitationsController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // Property owners and admins can create invitations
        [HttpPost]
        [Authorize(Roles = "Admin,PropertyOwner")]
        public IActionResult CreateInvitation([FromBody] CreateInvitationRequest request)
        {
            var invitation = new TenantInvitation
            {
                PropertyId = request.PropertyId,
                Email = request.Email,
                RentAmount = request.RentAmount,
                LeaseStart = request.LeaseStart,
                LeaseEnd = request.LeaseEnd,
                Deposit = request.Deposit,
                InvitedByUserId = User.FindFirst("sub")?.Value ?? User.Identity?.Name
            };

            _invitations.Add(invitation);

            // Get frontend URL from configuration
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
            var invitationLink = $"{frontendUrl}/onboard?token={invitation.InvitationToken}";

            return Ok(new
            {
                id = invitation.Id,
                invitationToken = invitation.InvitationToken,
                invitationLink = invitationLink,
                email = invitation.Email,
                expiresAt = invitation.ExpiresAt,
                status = invitation.Status.ToString()
            });
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
        public IActionResult ResendInvitation(string id)
        {
            var invitation = _invitations.FirstOrDefault(i => i.Id == id);

            if (invitation == null)
            {
                return NotFound(new { message = "Invitation not found" });
            }

            // Generate new token and extend expiration
            invitation.InvitationToken = Guid.NewGuid().ToString();
            invitation.ExpiresAt = DateTimeOffset.UtcNow.AddDays(7);
            invitation.Status = InvitationStatus.Pending;
            invitation.UpdatedAt = DateTimeOffset.UtcNow;

            // Get frontend URL from configuration
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
            var invitationLink = $"{frontendUrl}/onboard?token={invitation.InvitationToken}";

            return Ok(new
            {
                id = invitation.Id,
                invitationToken = invitation.InvitationToken,
                invitationLink = invitationLink,
                expiresAt = invitation.ExpiresAt
            });
        }

        // Internal method to get invitations list for testing
        public static List<TenantInvitation> GetInvitationsList() => _invitations;
    }
}
