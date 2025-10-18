using RentManager.API.Models;

namespace RentManager.API.Models.DTOs;

/// <summary>
/// DTO for initiating a new payment
/// </summary>
public class InitiatePaymentRequest
{
    public string TenantId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; }
    public string? Notes { get; set; }
    public string? BankIBAN { get; set; }
    public string? BankAccountHolder { get; set; }
}

/// <summary>
/// DTO for processing a payment
/// </summary>
public class ProcessPaymentRequest
{
    public string PaymentId { get; set; } = string.Empty;
    public string? ExternalTransactionId { get; set; }
    public string? PaymentGatewayProvider { get; set; }
}

/// <summary>
/// DTO for confirming a payment with a confirmation code
/// </summary>
public class ConfirmPaymentRequest
{
    public string PaymentId { get; set; } = string.Empty;
    public string ConfirmationCode { get; set; } = string.Empty;
}

/// <summary>
/// DTO for cancelling a payment
/// </summary>
public class CancelPaymentRequest
{
    public string PaymentId { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// DTO for refunding a payment
/// </summary>
public class RefundPaymentRequest
{
    public string PaymentId { get; set; } = string.Empty;
    public decimal? Amount { get; set; }
    public string? Reason { get; set; }
}

/// <summary>
/// DTO for payment reconciliation by reference
/// </summary>
public class ReconcilePaymentRequest
{
    public string PaymentReference { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? BankIBAN { get; set; }
}

/// <summary>
/// DTO for generating recurring payments
/// </summary>
public class GenerateRecurringPaymentsRequest
{
    public int Year { get; set; }
    public int Month { get; set; }
}

/// <summary>
/// DTO for payment statistics response
/// </summary>
public class PaymentStatisticsResponse
{
    public decimal TotalCollected { get; set; }
    public int TotalPayments { get; set; }
    public Dictionary<PaymentMethod, decimal> ByMethod { get; set; } = new();
    public Dictionary<PaymentStatus, int> ByStatus { get; set; } = new();
    public decimal AveragePayment { get; set; }
    public List<MonthlyPaymentSummary> MonthlyBreakdown { get; set; } = new();
}

/// <summary>
/// DTO for monthly payment summary
/// </summary>
public class MonthlyPaymentSummary
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal TotalAmount { get; set; }
    public int PaymentCount { get; set; }
}

/// <summary>
/// DTO for payment response with additional metadata
/// </summary>
public class PaymentResponse
{
    public string Id { get; set; } = string.Empty;
    public string TenantId { get; set; } = string.Empty;
    public string? TenantName { get; set; }
    public string? PropertyName { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; }
    public string? Notes { get; set; }
    public string? PaymentReference { get; set; }
    public string? ConfirmationCode { get; set; }
    public bool IsRecurring { get; set; }
    public DateTime? RecurringForMonth { get; set; }
    public bool IsRefunded { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static PaymentResponse FromPayment(Payment payment, string? tenantName = null, string? propertyName = null)
    {
        return new PaymentResponse
        {
            Id = payment.Id,
            TenantId = payment.TenantId,
            TenantName = tenantName,
            PropertyName = propertyName,
            Amount = payment.Amount,
            Date = payment.Date,
            Method = payment.Method,
            Status = payment.Status,
            Notes = payment.Notes,
            PaymentReference = payment.PaymentReference,
            ConfirmationCode = payment.ConfirmationCode,
            IsRecurring = payment.IsRecurring,
            RecurringForMonth = payment.RecurringForMonth,
            IsRefunded = payment.IsRefunded,
            CreatedAt = payment.CreatedAt,
            UpdatedAt = payment.UpdatedAt
        };
    }
}

/// <summary>
/// DTO for validating Romanian IBAN
/// </summary>
public class ValidateIBANRequest
{
    public string IBAN { get; set; } = string.Empty;
}

/// <summary>
/// DTO for IBAN validation response
/// </summary>
public class ValidateIBANResponse
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
}
