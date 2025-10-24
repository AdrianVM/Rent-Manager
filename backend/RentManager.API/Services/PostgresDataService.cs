using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;

namespace RentManager.API.Services
{
    public class PostgresDataService : IDataService
    {
        private readonly RentManagerDbContext _context;
        private readonly ILogger<PostgresDataService> _logger;

        public PostgresDataService(RentManagerDbContext context, ILogger<PostgresDataService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // User operations
        public async Task<User?> GetUserByIdAsync(string id)
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .ToListAsync();
        }

        public async Task<User> CreateUserAsync(User user)
        {
            if (string.IsNullOrEmpty(user.Id))
            {
                user.Id = Guid.NewGuid().ToString();
            }
            user.CreatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User?> UpdateUserAsync(string id, User user)
        {
            var existingUser = await _context.Users.FindAsync(id);
            if (existingUser == null)
            {
                return null;
            }

            existingUser.Name = user.Name;
            existingUser.Email = user.Email;
            existingUser.IsActive = user.IsActive;
            existingUser.TenantId = user.TenantId;
            existingUser.PropertyIds = user.PropertyIds;
            existingUser.UpdatedAt = DateTime.UtcNow;

            // Handle role updates if provided
            if (user.UserRoles != null && user.UserRoles.Any())
            {
                // Remove existing roles
                var existingRoles = await _context.UserRoles
                    .Where(ur => ur.UserId == id)
                    .ToListAsync();
                _context.UserRoles.RemoveRange(existingRoles);

                // Add new roles
                foreach (var userRole in user.UserRoles)
                {
                    userRole.UserId = id;
                    userRole.AssignedAt = DateTime.UtcNow;
                    _context.UserRoles.Add(userRole);
                }
            }

            await _context.SaveChangesAsync();
            return existingUser;
        }

        public async Task<bool> DeleteUserAsync(string id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return false;
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        // Property operations
        public async Task<List<Property>> GetPropertiesAsync(User? user = null)
        {
            // TODO: Add user-based filtering if needed
            return await _context.Properties.ToListAsync();
        }

        public async Task<Property?> GetPropertyAsync(string id, User? user = null)
        {
            // TODO: Add user-based access control if needed
            return await _context.Properties.FindAsync(id);
        }

        public async Task<Property> CreatePropertyAsync(Property property, User? user = null)
        {
            if (string.IsNullOrEmpty(property.Id))
            {
                property.Id = Guid.NewGuid().ToString();
            }
            property.CreatedAt = DateTime.UtcNow;
            property.UpdatedAt = DateTime.UtcNow;
            _context.Properties.Add(property);
            await _context.SaveChangesAsync();
            return property;
        }

        public async Task<Property?> UpdatePropertyAsync(string id, Property property, User? user = null)
        {
            var existingProperty = await _context.Properties.FindAsync(id);
            if (existingProperty == null)
            {
                return null;
            }

            existingProperty.Name = property.Name;
            existingProperty.Address = property.Address;
            existingProperty.Type = property.Type;
            existingProperty.Bedrooms = property.Bedrooms;
            existingProperty.Bathrooms = property.Bathrooms;
            existingProperty.RentAmount = property.RentAmount;
            existingProperty.Description = property.Description;
            existingProperty.ParkingType = property.ParkingType;
            existingProperty.SpaceNumber = property.SpaceNumber;
            existingProperty.SquareFootage = property.SquareFootage;
            existingProperty.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existingProperty;
        }

        public async Task<bool> DeletePropertyAsync(string id, User? user = null)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null)
            {
                return false;
            }

            _context.Properties.Remove(property);
            await _context.SaveChangesAsync();
            return true;
        }

        // Tenant operations
        public async Task<List<Tenant>> GetTenantsAsync(User? user = null)
        {
            // TODO: Add user-based filtering if needed
            return await _context.Tenants.ToListAsync();
        }

        public async Task<Tenant?> GetTenantAsync(string id, User? user = null)
        {
            // TODO: Add user-based access control if needed
            return await _context.Tenants.FindAsync(id);
        }

        public async Task<Tenant> CreateTenantAsync(Tenant tenant, User? user = null)
        {
            if (string.IsNullOrEmpty(tenant.Id))
            {
                tenant.Id = Guid.NewGuid().ToString();
            }
            tenant.CreatedAt = DateTime.UtcNow;
            tenant.UpdatedAt = DateTime.UtcNow;
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();
            return tenant;
        }

        public async Task<Tenant?> UpdateTenantAsync(string id, Tenant tenant, User? user = null)
        {
            var existingTenant = await _context.Tenants.FindAsync(id);
            if (existingTenant == null)
            {
                return null;
            }

            existingTenant.TenantType = tenant.TenantType;
            existingTenant.Email = tenant.Email;
            existingTenant.Phone = tenant.Phone;
            existingTenant.PropertyId = tenant.PropertyId;
            existingTenant.LeaseStart = tenant.LeaseStart;
            existingTenant.LeaseEnd = tenant.LeaseEnd;
            existingTenant.RentAmount = tenant.RentAmount;
            existingTenant.Deposit = tenant.Deposit;
            existingTenant.Status = tenant.Status;
            existingTenant.PersonDetails = tenant.PersonDetails;
            existingTenant.CompanyDetails = tenant.CompanyDetails;
            existingTenant.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existingTenant;
        }

        public async Task<bool> DeleteTenantAsync(string id, User? user = null)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null)
            {
                return false;
            }

            _context.Tenants.Remove(tenant);
            await _context.SaveChangesAsync();
            return true;
        }

        // Payment operations
        public async Task<List<Payment>> GetPaymentsAsync(User? user = null)
        {
            // TODO: Add user-based filtering if needed
            return await _context.Payments.OrderByDescending(p => p.Date).ToListAsync();
        }

        public async Task<Payment?> GetPaymentAsync(string id, User? user = null)
        {
            // TODO: Add user-based access control if needed
            return await _context.Payments.FindAsync(id);
        }

        public async Task<Payment> CreatePaymentAsync(Payment payment, User? user = null)
        {
            if (string.IsNullOrEmpty(payment.Id))
            {
                payment.Id = Guid.NewGuid().ToString();
            }
            payment.CreatedAt = DateTime.UtcNow;
            payment.UpdatedAt = DateTime.UtcNow;
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();
            return payment;
        }

        public async Task<Payment?> UpdatePaymentAsync(string id, Payment payment, User? user = null)
        {
            var existingPayment = await _context.Payments.FindAsync(id);
            if (existingPayment == null)
            {
                return null;
            }

            existingPayment.TenantId = payment.TenantId;
            existingPayment.Amount = payment.Amount;
            existingPayment.Date = payment.Date;
            existingPayment.Method = payment.Method;
            existingPayment.Status = payment.Status;
            existingPayment.Notes = payment.Notes;
            existingPayment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existingPayment;
        }

        public async Task<bool> DeletePaymentAsync(string id, User? user = null)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return false;
            }

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();
            return true;
        }

        // Contract operations
        public async Task<List<Contract>> GetContractsAsync(User? user = null)
        {
            // TODO: Add user-based filtering if needed
            return await _context.Contracts.ToListAsync();
        }

        public async Task<Contract?> GetContractAsync(string id, User? user = null)
        {
            // TODO: Add user-based access control if needed
            return await _context.Contracts.FindAsync(id);
        }

        public async Task<List<Contract>> GetContractsByPropertyIdAsync(string propertyId, User? user = null)
        {
            return await _context.Contracts
                .Where(c => c.PropertyId == propertyId)
                .ToListAsync();
        }

        public async Task<List<Contract>> GetContractsByTenantIdAsync(string tenantId, User? user = null)
        {
            return await _context.Contracts
                .Where(c => c.TenantId == tenantId)
                .ToListAsync();
        }

        public async Task<Contract> CreateContractAsync(Contract contract, User? user = null)
        {
            if (string.IsNullOrEmpty(contract.Id))
            {
                contract.Id = Guid.NewGuid().ToString();
            }
            contract.UploadedAt = DateTime.UtcNow;
            _context.Contracts.Add(contract);
            await _context.SaveChangesAsync();
            return contract;
        }

        public async Task<Contract?> UpdateContractAsync(string id, Contract contract, User? user = null)
        {
            var existingContract = await _context.Contracts.FindAsync(id);
            if (existingContract == null)
            {
                return null;
            }

            existingContract.PropertyId = contract.PropertyId;
            existingContract.TenantId = contract.TenantId;
            existingContract.FileName = contract.FileName;
            existingContract.FileContentBase64 = contract.FileContentBase64;
            existingContract.MimeType = contract.MimeType;
            existingContract.FileSizeBytes = contract.FileSizeBytes;
            existingContract.SignedAt = contract.SignedAt;
            existingContract.Status = contract.Status;
            existingContract.Notes = contract.Notes;

            await _context.SaveChangesAsync();
            return existingContract;
        }

        public async Task<bool> DeleteContractAsync(string id, User? user = null)
        {
            var contract = await _context.Contracts.FindAsync(id);
            if (contract == null)
            {
                return false;
            }

            _context.Contracts.Remove(contract);
            await _context.SaveChangesAsync();
            return true;
        }

        // Dashboard operations
        public async Task<DashboardStats> GetDashboardStatsAsync(User? user = null)
        {
            var properties = await GetPropertiesAsync(user);
            var tenants = await GetTenantsAsync(user);
            var payments = await GetPaymentsAsync(user);

            var activeTenants = tenants.Count(t => t.Status == TenantStatus.Active);
            var totalRent = properties.Sum(p => p.RentAmount);

            // Calculate payments received this month
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;
            var paymentsThisMonth = payments
                .Where(p => p.Date.Month == currentMonth && p.Date.Year == currentYear && p.Status == PaymentStatus.Completed)
                .Sum(p => p.Amount);

            // Recent payments (last 5)
            var recentPayments = payments
                .OrderByDescending(p => p.Date)
                .Take(5)
                .Select(p => new RecentPayment
                {
                    Id = p.Id,
                    Amount = p.Amount,
                    Date = p.Date,
                    TenantName = tenants.FirstOrDefault(t => t.Id == p.TenantId)?.Name ?? "Unknown",
                    PropertyName = GetPropertyNameForTenant(tenants.FirstOrDefault(t => t.Id == p.TenantId), properties)
                })
                .ToList();

            // Outstanding rent
            var outstandingRent = new List<OutstandingRentItem>();
            foreach (var tenant in tenants.Where(t => t.Status == TenantStatus.Active))
            {
                var tenantPayments = payments.Where(p => p.TenantId == tenant.Id && p.Status == PaymentStatus.Completed);
                var totalPaid = tenantPayments.Sum(p => p.Amount);
                var expectedPayments = CalculateExpectedPayments(tenant);
                var outstandingAmount = expectedPayments - totalPaid;

                if (outstandingAmount > 0)
                {
                    outstandingRent.Add(new OutstandingRentItem
                    {
                        TenantId = tenant.Id,
                        TenantName = tenant.Name,
                        PropertyName = properties.FirstOrDefault(p => p.Id == tenant.PropertyId)?.Name ?? "Unknown",
                        AmountDue = outstandingAmount,
                        TotalPaid = totalPaid,
                        IsOverdue = CalculateMonthsOverdue(tenant, totalPaid) > 0
                    });
                }
            }

            return new DashboardStats
            {
                TotalProperties = properties.Count,
                ActiveTenants = activeTenants,
                TotalMonthlyRent = totalRent,
                MonthlyCollected = paymentsThisMonth,
                OutstandingRent = outstandingRent.Sum(o => o.AmountDue),
                PendingPayments = outstandingRent.Count,
                RecentPayments = recentPayments,
                OutstandingRentItems = outstandingRent
            };
        }

        private string GetPropertyNameForTenant(Tenant? tenant, List<Property> properties)
        {
            if (tenant == null) return "Unknown";
            return properties.FirstOrDefault(p => p.Id == tenant.PropertyId)?.Name ?? "Unknown";
        }

        private decimal CalculateExpectedPayments(Tenant tenant)
        {
            if (tenant.LeaseStart == null) return 0;

            var monthsSinceStart = ((DateTime.UtcNow.Year - tenant.LeaseStart.Value.Year) * 12) +
                                   DateTime.UtcNow.Month - tenant.LeaseStart.Value.Month + 1;
            return Math.Max(0, monthsSinceStart * tenant.RentAmount);
        }

        private int CalculateMonthsOverdue(Tenant tenant, decimal totalPaid)
        {
            if (tenant.RentAmount == 0) return 0;

            var expectedPayments = CalculateExpectedPayments(tenant);
            var outstandingAmount = expectedPayments - totalPaid;
            return (int)Math.Ceiling(outstandingAmount / tenant.RentAmount);
        }
    }
}
