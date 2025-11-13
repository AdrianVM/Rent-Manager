using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;
using RentManager.API.Services.Email;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ContractsController : ControllerBase
    {
        private readonly IDataService _dataService;
        private readonly IBackgroundEmailService _backgroundEmailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ContractsController> _logger;

        public ContractsController(
            IDataService dataService,
            IBackgroundEmailService backgroundEmailService,
            IConfiguration configuration,
            ILogger<ContractsController> logger)
        {
            _dataService = dataService;
            _backgroundEmailService = backgroundEmailService;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<Contract>>> GetContracts()
        {
            var contracts = await _dataService.GetContractsAsync();
            return Ok(contracts);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Contract>> GetContract(string id)
        {
            var contract = await _dataService.GetContractAsync(id);
            if (contract == null)
            {
                return NotFound();
            }
            return Ok(contract);
        }

        [HttpGet("property/{propertyId}")]
        public async Task<ActionResult<List<Contract>>> GetContractsByProperty(string propertyId)
        {
            var contracts = await _dataService.GetContractsByPropertyIdAsync(propertyId);
            return Ok(contracts);
        }

        [HttpGet("tenant/{tenantId}")]
        public async Task<ActionResult<List<Contract>>> GetContractsByTenant(string tenantId)
        {
            var contracts = await _dataService.GetContractsByTenantIdAsync(tenantId);
            return Ok(contracts);
        }

        [HttpPost]
        public async Task<ActionResult<Contract>> CreateContract([FromBody] ContractUploadRequest request)
        {
            try
            {
                var contract = new Contract
                {
                    PropertyId = request.PropertyId,
                    TenantId = request.TenantId,
                    FileName = request.FileName,
                    FileContentBase64 = request.FileContentBase64,
                    MimeType = request.MimeType,
                    FileSizeBytes = request.FileSizeBytes,
                    Status = request.Status,
                    Notes = request.Notes
                };

                var createdContract = await _dataService.CreateContractAsync(contract);

                // Send contract upload notification email to tenant
                try
                {
                    await SendContractUploadNotificationAsync(createdContract);
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Failed to send contract upload notification email for contract {ContractId}", createdContract.Id);
                    // Don't fail the entire request if email fails
                }

                return CreatedAtAction(nameof(GetContract), new { id = createdContract.Id }, createdContract);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating contract: {ex.Message}");
            }
        }

        private async Task SendContractUploadNotificationAsync(Contract contract)
        {
            // Get tenant details
            var tenant = await _dataService.GetTenantAsync(contract.TenantId);
            if (tenant == null)
            {
                _logger.LogWarning("Cannot send contract upload notification: Tenant {TenantId} not found", contract.TenantId);
                return;
            }

            // Get property details
            var property = await _dataService.GetPropertyAsync(contract.PropertyId);
            if (property == null)
            {
                _logger.LogWarning("Cannot send contract upload notification: Property {PropertyId} not found", contract.PropertyId);
                return;
            }

            // Get property owner details from PropertyOwner
            var propertyOwner = await _dataService.GetPropertyOwnerByPropertyIdAsync(contract.PropertyId);

            // Get current user info for owner details (the person uploading the contract)
            var ownerName = User.FindFirst("name")?.Value ?? "Property Owner";
            var ownerEmail = User.FindFirst("email")?.Value ?? _configuration["ScalewayEmail:DefaultFromEmail"] ?? "noreply@rentflow.ro";

            // Try to get owner phone from PropertyOwner's first person if available
            string? ownerPhone = null;
            if (propertyOwner != null && propertyOwner.PersonOwners.Any())
            {
                var firstOwnerPerson = propertyOwner.PersonOwners.FirstOrDefault();
                ownerPhone = firstOwnerPerson?.Phone;
            }

            // Get frontend URL from configuration
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
            var contractViewUrl = $"{frontendUrl}/contracts/{contract.Id}";

            // Extract tenant first name from person name or email
            var tenantFirstName = !string.IsNullOrWhiteSpace(tenant.Person?.FirstName)
                ? tenant.Person.FirstName
                : tenant.Email.Split('@')[0];

            // Determine contract type from file name
            var contractType = "Lease Agreement";
            if (contract.FileName.Contains("addendum", StringComparison.OrdinalIgnoreCase))
            {
                contractType = "Lease Addendum";
            }
            else if (contract.FileName.Contains("amendment", StringComparison.OrdinalIgnoreCase))
            {
                contractType = "Lease Amendment";
            }

            // Format contract status for display
            var statusDisplay = contract.Status.ToString();

            // Prepare email data
            var emailData = new ContractUploadEmailData
            {
                TenantFirstName = tenantFirstName,
                TenantEmail = tenant.Email,
                PropertyAddress = property.Address,
                ContractType = contractType,
                UploadDate = contract.UploadedAt.ToString("dd.MM.yyyy HH:mm"),
                UploadedBy = ownerName,
                ContractStatus = statusDisplay,
                ContractViewUrl = contractViewUrl,
                OwnerName = ownerName,
                OwnerEmail = ownerEmail,
                OwnerPhone = ownerPhone,
                FrontendUrl = frontendUrl
            };

            // Determine subject based on contract status
            var subject = contract.Status == ContractStatus.Pending
                ? $"Action Required: New Contract for {property.Address}"
                : $"New Contract Available for {property.Address}";

            // Enqueue email in background
            var emailJobId = _backgroundEmailService.EnqueueContractUploadEmail(emailData, subject);

            _logger.LogInformation("Contract upload notification email enqueued (JobId: {JobId}) for contract {ContractId} to {Email}",
                emailJobId, contract.Id, tenant.Email);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Contract>> UpdateContract(string id, [FromBody] ContractUpdateRequest request)
        {
            var contract = await _dataService.GetContractAsync(id);
            if (contract == null)
            {
                return NotFound();
            }

            contract.PropertyId = request.PropertyId;
            contract.TenantId = request.TenantId;
            contract.Status = request.Status;
            contract.SignedAt = request.SignedAt;
            contract.Notes = request.Notes;

            var updatedContract = await _dataService.UpdateContractAsync(id, contract);
            return Ok(updatedContract);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteContract(string id)
        {
            var result = await _dataService.DeleteContractAsync(id);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }

        [HttpGet("{id}/download")]
        public async Task<ActionResult> DownloadContract(string id)
        {
            var contract = await _dataService.GetContractAsync(id);
            if (contract == null)
            {
                return NotFound();
            }

            try
            {
                var fileBytes = Convert.FromBase64String(contract.FileContentBase64);
                return File(fileBytes, contract.MimeType, contract.FileName);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error downloading contract: {ex.Message}");
            }
        }
    }

    public class ContractUploadRequest
    {
        public string PropertyId { get; set; } = string.Empty;
        public string TenantId { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string FileContentBase64 { get; set; } = string.Empty;
        public string MimeType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public ContractStatus Status { get; set; } = ContractStatus.Draft;
        public string? Notes { get; set; }
    }

    public class ContractUpdateRequest
    {
        public string PropertyId { get; set; } = string.Empty;
        public string TenantId { get; set; } = string.Empty;
        public ContractStatus Status { get; set; }
        public DateTime? SignedAt { get; set; }
        public string? Notes { get; set; }
    }
}