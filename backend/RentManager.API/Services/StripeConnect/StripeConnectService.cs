using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RentManager.API.Data;
using RentManager.API.Models;
using RentManager.API.Services.PaymentGateway;
using Stripe;
using System.Text.Json;

namespace RentManager.API.Services.StripeConnect;

/// <summary>
/// Stripe Connect service implementation for managing connected accounts
/// </summary>
public class StripeConnectService : IStripeConnectService
{
    private readonly IUnitOfWork _context;
    private readonly ILogger<StripeConnectService> _logger;
    private readonly StripeSettings _stripeSettings;

    public StripeConnectService(
        IUnitOfWork context,
        ILogger<StripeConnectService> logger,
        IOptions<StripeSettings> stripeSettings)
    {
        _context = context;
        _logger = logger;
        _stripeSettings = stripeSettings.Value;

        StripeConfiguration.ApiKey = _stripeSettings.SecretKey;
    }

    public async Task<StripeConnectAccount> CreateConnectAccountAsync(
        string propertyOwnerId,
        StripeAccountType accountType = StripeAccountType.Express,
        string? email = null)
    {
        // Check if account already exists
        var existingAccount = await GetAccountByPropertyOwnerIdAsync(propertyOwnerId);
        if (existingAccount != null)
        {
            _logger.LogWarning("Stripe Connect account already exists for property owner: {PropertyOwnerId}", propertyOwnerId);
            return existingAccount;
        }

        // Get property owner details
        var propertyOwner = await _context.PropertyOwners
            .Include(po => po.PersonOwners)
            .Include(po => po.OwningCompanies)
            .FirstOrDefaultAsync(po => po.Id == propertyOwnerId);

        if (propertyOwner == null)
        {
            throw new ArgumentException($"Property owner with ID {propertyOwnerId} not found");
        }

        try
        {
            // Determine account type based on owner type
            var stripeAccountType = accountType == StripeAccountType.Express ? "express" : "standard";

            // Build account creation options
            var options = new AccountCreateOptions
            {
                Type = stripeAccountType,
                Country = "RO", // Romania
                Email = email,
                Capabilities = new AccountCapabilitiesOptions
                {
                    CardPayments = new AccountCapabilitiesCardPaymentsOptions
                    {
                        Requested = true,
                    },
                    Transfers = new AccountCapabilitiesTransfersOptions
                    {
                        Requested = true,
                    },
                },
                BusinessType = propertyOwner.PersonOwners.Any() ? "individual" : "company",
                Settings = new AccountSettingsOptions
                {
                    Payouts = new AccountSettingsPayoutsOptions
                    {
                        Schedule = new AccountSettingsPayoutsScheduleOptions
                        {
                            Interval = "manual", // Manual payouts by default
                        },
                    },
                },
                Metadata = new Dictionary<string, string>
                {
                    { "property_owner_id", propertyOwnerId },
                    { "platform", "RentManager" }
                }
            };

            // Add individual or company information
            if (propertyOwner.PersonOwners.Any())
            {
                var person = propertyOwner.PersonOwners.First();
                options.Individual = new AccountIndividualOptions
                {
                    Email = email,
                    FirstName = person.FirstName,
                    LastName = person.LastName,
                    Phone = person.Phone,
                };
            }
            else if (propertyOwner.OwningCompanies.Any())
            {
                var company = propertyOwner.OwningCompanies.First();
                options.Company = new AccountCompanyOptions
                {
                    Name = company.CompanyName,
                    TaxId = company.TaxId,
                    Phone = company.ContactPersonPhone,
                };
            }

            // Create Stripe account
            var service = new AccountService();
            var stripeAccount = await service.CreateAsync(options);

            _logger.LogInformation("Stripe Connect account created: {StripeAccountId} for property owner: {PropertyOwnerId}",
                stripeAccount.Id, propertyOwnerId);

            // Create local record
            var connectAccount = new StripeConnectAccount
            {
                Id = Guid.NewGuid().ToString(),
                PropertyOwnerId = propertyOwnerId,
                StripeAccountId = stripeAccount.Id,
                AccountType = accountType,
                Status = StripeAccountStatus.PendingOnboarding,
                OnboardingCompleted = false,
                CanAcceptPayments = false,
                CanCreatePayouts = false,
                IdentityVerified = false,
                DocumentsRequired = false,
                Currency = _stripeSettings.Currency,
                DefaultPayoutSchedule = "manual",
                InstantPayoutsEnabled = false,
                StripeEmail = email,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _context.Set<StripeConnectAccount>().Add(connectAccount);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Stripe Connect account record created in database: {Id}", connectAccount.Id);

            return connectAccount;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating Connect account for property owner: {PropertyOwnerId}", propertyOwnerId);
            throw new InvalidOperationException($"Failed to create Stripe Connect account: {ex.Message}", ex);
        }
    }

    public async Task<OnboardingLinkResult> GenerateOnboardingLinkAsync(
        string stripeConnectAccountId,
        string refreshUrl,
        string returnUrl)
    {
        var connectAccount = await _context.Set<StripeConnectAccount>()
            .FirstOrDefaultAsync(a => a.Id == stripeConnectAccountId);

        if (connectAccount == null)
        {
            throw new ArgumentException($"Stripe Connect account with ID {stripeConnectAccountId} not found");
        }

        try
        {
            var options = new AccountLinkCreateOptions
            {
                Account = connectAccount.StripeAccountId,
                RefreshUrl = refreshUrl,
                ReturnUrl = returnUrl,
                Type = "account_onboarding",
            };

            var service = new AccountLinkService();
            var accountLink = await service.CreateAsync(options);

            // Update local record
            connectAccount.OnboardingUrl = accountLink.Url;
            connectAccount.OnboardingUrlExpiresAt = DateTimeOffset.UtcNow.AddMinutes(5); // Links expire quickly
            connectAccount.Status = StripeAccountStatus.OnboardingStarted;
            connectAccount.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Onboarding link generated for Stripe account: {StripeAccountId}", connectAccount.StripeAccountId);

            return new OnboardingLinkResult
            {
                Url = accountLink.Url,
                ExpiresAt = connectAccount.OnboardingUrlExpiresAt.Value,
                StripeConnectAccountId = stripeConnectAccountId
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error generating onboarding link for account: {StripeAccountId}", connectAccount.StripeAccountId);
            throw new InvalidOperationException($"Failed to generate onboarding link: {ex.Message}", ex);
        }
    }

    public async Task<StripeConnectAccount> RefreshAccountStatusAsync(string stripeConnectAccountId)
    {
        var connectAccount = await _context.Set<StripeConnectAccount>()
            .FirstOrDefaultAsync(a => a.Id == stripeConnectAccountId);

        if (connectAccount == null)
        {
            throw new ArgumentException($"Stripe Connect account with ID {stripeConnectAccountId} not found");
        }

        try
        {
            var service = new AccountService();
            var stripeAccount = await service.GetAsync(connectAccount.StripeAccountId);

            // Update capabilities
            var chargesEnabled = stripeAccount.ChargesEnabled;
            var payoutsEnabled = stripeAccount.PayoutsEnabled;
            var detailsSubmitted = stripeAccount.DetailsSubmitted;

            connectAccount.CanAcceptPayments = chargesEnabled;
            connectAccount.CanCreatePayouts = payoutsEnabled;
            connectAccount.OnboardingCompleted = detailsSubmitted;

            // Update verification status
            connectAccount.IdentityVerified = stripeAccount.Individual?.Verification?.Status == "verified" ||
                                              stripeAccount.Company?.Verification?.Document?.Back != null;

            // Determine overall status
            if (chargesEnabled && payoutsEnabled && detailsSubmitted)
            {
                connectAccount.Status = StripeAccountStatus.Active;
                if (!connectAccount.OnboardingCompletedAt.HasValue)
                {
                    connectAccount.OnboardingCompletedAt = DateTimeOffset.UtcNow;
                    connectAccount.VerifiedAt = DateTimeOffset.UtcNow;
                }
            }
            else if (detailsSubmitted)
            {
                connectAccount.Status = StripeAccountStatus.Restricted;
                connectAccount.DisabledReason = "Pending verification";
            }
            else
            {
                connectAccount.Status = StripeAccountStatus.OnboardingIncomplete;
            }

            // Check for required documents
            var requirementsCurrently = stripeAccount.Requirements?.CurrentlyDue;
            connectAccount.DocumentsRequired = requirementsCurrently?.Any() ?? false;
            if (connectAccount.DocumentsRequired)
            {
                connectAccount.RequiredDocuments = JsonSerializer.Serialize(requirementsCurrently);
            }

            // Update bank account info (last 4 digits only)
            if (stripeAccount.ExternalAccounts?.Data?.Any() == true)
            {
                var bankAccount = stripeAccount.ExternalAccounts.Data.FirstOrDefault() as BankAccount;
                if (bankAccount != null)
                {
                    connectAccount.BankAccountLast4 = bankAccount.Last4;
                    connectAccount.BankName = bankAccount.BankName;
                    connectAccount.BankCountry = bankAccount.Country;
                }
            }

            connectAccount.UpdatedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Account status refreshed for Stripe account: {StripeAccountId}, Status: {Status}",
                connectAccount.StripeAccountId, connectAccount.Status);

            return connectAccount;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error refreshing account status: {StripeAccountId}", connectAccount.StripeAccountId);
            throw new InvalidOperationException($"Failed to refresh account status: {ex.Message}", ex);
        }
    }

    public async Task<StripeConnectAccount?> GetAccountByPropertyOwnerIdAsync(string propertyOwnerId)
    {
        return await _context.Set<StripeConnectAccount>()
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.PropertyOwnerId == propertyOwnerId);
    }

    public async Task<StripeConnectAccount?> GetAccountByStripeAccountIdAsync(string stripeAccountId)
    {
        return await _context.Set<StripeConnectAccount>()
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.StripeAccountId == stripeAccountId);
    }

    public async Task<bool> CanAcceptPaymentsAsync(string propertyOwnerId)
    {
        var account = await GetAccountByPropertyOwnerIdAsync(propertyOwnerId);
        return account?.CanAcceptPayments == true && account.IsActive && account.Status == StripeAccountStatus.Active;
    }

    public async Task<StripeConnectAccount> DisableAccountAsync(string stripeConnectAccountId, string reason)
    {
        var connectAccount = await _context.Set<StripeConnectAccount>()
            .FirstOrDefaultAsync(a => a.Id == stripeConnectAccountId);

        if (connectAccount == null)
        {
            throw new ArgumentException($"Stripe Connect account with ID {stripeConnectAccountId} not found");
        }

        connectAccount.IsActive = false;
        connectAccount.DeactivationReason = reason;
        connectAccount.DeactivatedAt = DateTimeOffset.UtcNow;
        connectAccount.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Stripe Connect account disabled: {StripeAccountId}, Reason: {Reason}",
            connectAccount.StripeAccountId, reason);

        return connectAccount;
    }

    public async Task<StripeConnectAccount> EnableAccountAsync(string stripeConnectAccountId)
    {
        var connectAccount = await _context.Set<StripeConnectAccount>()
            .FirstOrDefaultAsync(a => a.Id == stripeConnectAccountId);

        if (connectAccount == null)
        {
            throw new ArgumentException($"Stripe Connect account with ID {stripeConnectAccountId} not found");
        }

        connectAccount.IsActive = true;
        connectAccount.DeactivationReason = null;
        connectAccount.DeactivatedAt = null;
        connectAccount.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Stripe Connect account enabled: {StripeAccountId}", connectAccount.StripeAccountId);

        return connectAccount;
    }

    public async Task<string> GenerateLoginLinkAsync(string stripeConnectAccountId)
    {
        var connectAccount = await _context.Set<StripeConnectAccount>()
            .FirstOrDefaultAsync(a => a.Id == stripeConnectAccountId);

        if (connectAccount == null)
        {
            throw new ArgumentException($"Stripe Connect account with ID {stripeConnectAccountId} not found");
        }

        try
        {
            var service = new LoginLinkService();
            var loginLink = await service.CreateAsync(connectAccount.StripeAccountId);

            _logger.LogInformation("Login link generated for Stripe account: {StripeAccountId}", connectAccount.StripeAccountId);

            return loginLink.Url;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error generating login link for account: {StripeAccountId}", connectAccount.StripeAccountId);
            throw new InvalidOperationException($"Failed to generate login link: {ex.Message}", ex);
        }
    }

    public async Task<AccountBalanceResult> GetAccountBalanceAsync(string stripeAccountId)
    {
        try
        {
            var requestOptions = new RequestOptions
            {
                StripeAccount = stripeAccountId
            };

            var service = new BalanceService();
            var balance = await service.GetAsync(requestOptions);

            var availableAmount = balance.Available.Sum(b => b.Amount) / 100m; // Convert from cents
            var pendingAmount = balance.Pending.Sum(b => b.Amount) / 100m;

            _logger.LogInformation("Retrieved balance for Stripe account: {StripeAccountId}, Available: {Available}",
                stripeAccountId, availableAmount);

            return new AccountBalanceResult
            {
                Available = availableAmount,
                Pending = pendingAmount,
                Currency = _stripeSettings.Currency
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error getting balance for account: {StripeAccountId}", stripeAccountId);
            throw new InvalidOperationException($"Failed to get account balance: {ex.Message}", ex);
        }
    }

    public async Task<PayoutResult> CreatePayoutAsync(
        string stripeAccountId,
        decimal amount,
        string currency = "ron",
        string? description = null)
    {
        try
        {
            var requestOptions = new RequestOptions
            {
                StripeAccount = stripeAccountId
            };

            var options = new PayoutCreateOptions
            {
                Amount = (long)(amount * 100), // Convert to cents
                Currency = currency,
                Description = description ?? "Rent payment payout",
                StatementDescriptor = "RENT PAYOUT",
            };

            var service = new PayoutService();
            var payout = await service.CreateAsync(options, requestOptions);

            _logger.LogInformation("Payout created for Stripe account: {StripeAccountId}, Amount: {Amount} {Currency}, PayoutId: {PayoutId}",
                stripeAccountId, amount, currency, payout.Id);

            return MapPayoutToResult(payout);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating payout for account: {StripeAccountId}", stripeAccountId);
            throw new InvalidOperationException($"Failed to create payout: {ex.Message}", ex);
        }
    }

    public async Task<List<PayoutResult>> ListPayoutsAsync(string stripeAccountId, int limit = 10)
    {
        try
        {
            var requestOptions = new RequestOptions
            {
                StripeAccount = stripeAccountId
            };

            var options = new PayoutListOptions
            {
                Limit = limit,
            };

            var service = new PayoutService();
            var payouts = await service.ListAsync(options, requestOptions);

            return payouts.Data.Select(MapPayoutToResult).ToList();
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error listing payouts for account: {StripeAccountId}", stripeAccountId);
            throw new InvalidOperationException($"Failed to list payouts: {ex.Message}", ex);
        }
    }

    #region Helper Methods

    private PayoutResult MapPayoutToResult(Payout payout)
    {
        return new PayoutResult
        {
            PayoutId = payout.Id,
            Amount = payout.Amount / 100m,
            Currency = payout.Currency,
            Status = payout.Status,
            ArrivalDate = payout.ArrivalDate.HasValue
                ? DateTimeOffset.FromUnixTimeSeconds(payout.ArrivalDate.Value)
                : null,
            BankAccountLast4 = payout.Destination is BankAccount ba ? ba.Last4 : null,
            Description = payout.Description,
            CreatedAt = DateTimeOffset.FromUnixTimeSeconds(payout.Created)
        };
    }

    #endregion
}
