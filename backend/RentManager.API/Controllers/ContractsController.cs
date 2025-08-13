using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContractsController : ControllerBase
    {
        private readonly IDataService _dataService;

        public ContractsController(IDataService dataService)
        {
            _dataService = dataService;
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
                return CreatedAtAction(nameof(GetContract), new { id = createdContract.Id }, createdContract);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating contract: {ex.Message}");
            }
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