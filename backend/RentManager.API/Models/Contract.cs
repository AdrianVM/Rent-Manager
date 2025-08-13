namespace RentManager.API.Models
{
    public class Contract
    {
        public string Id { get; set; } = string.Empty;
        public string PropertyId { get; set; } = string.Empty;
        public string TenantId { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string FileContentBase64 { get; set; } = string.Empty;
        public string MimeType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SignedAt { get; set; }
        public ContractStatus Status { get; set; } = ContractStatus.Draft;
        public string? Notes { get; set; }
    }

    public enum ContractStatus
    {
        Draft,
        Pending,
        Signed,
        Terminated
    }
}