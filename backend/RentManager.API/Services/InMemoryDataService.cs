using RentManager.API.Models;

namespace RentManager.API.Services
{
    public class InMemoryDataService : IDataService
    {
        private readonly List<Property> _properties = new();
        private readonly List<Tenant> _tenants = new();
        private readonly List<Payment> _payments = new();
        private readonly List<Contract> _contracts = new();

        // Properties
        public Task<List<Property>> GetPropertiesAsync()
        {
            return Task.FromResult(_properties);
        }

        public Task<Property?> GetPropertyAsync(string id)
        {
            var property = _properties.FirstOrDefault(p => p.Id == id);
            return Task.FromResult(property);
        }

        public Task<Property> CreatePropertyAsync(Property property)
        {
            property.Id = Guid.NewGuid().ToString();
            property.CreatedAt = DateTime.UtcNow;
            property.UpdatedAt = DateTime.UtcNow;
            _properties.Add(property);
            return Task.FromResult(property);
        }

        public Task<Property?> UpdatePropertyAsync(string id, Property property)
        {
            var existingProperty = _properties.FirstOrDefault(p => p.Id == id);
            if (existingProperty == null) return Task.FromResult<Property?>(null);

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

            return Task.FromResult<Property?>(existingProperty);
        }

        public Task<bool> DeletePropertyAsync(string id)
        {
            var property = _properties.FirstOrDefault(p => p.Id == id);
            if (property == null) return Task.FromResult(false);

            _properties.Remove(property);
            return Task.FromResult(true);
        }

        // Tenants
        public Task<List<Tenant>> GetTenantsAsync()
        {
            return Task.FromResult(_tenants);
        }

        public Task<Tenant?> GetTenantAsync(string id)
        {
            var tenant = _tenants.FirstOrDefault(t => t.Id == id);
            return Task.FromResult(tenant);
        }

        public Task<Tenant> CreateTenantAsync(Tenant tenant)
        {
            tenant.Id = Guid.NewGuid().ToString();
            tenant.CreatedAt = DateTime.UtcNow;
            tenant.UpdatedAt = DateTime.UtcNow;
            _tenants.Add(tenant);
            return Task.FromResult(tenant);
        }

        public Task<Tenant?> UpdateTenantAsync(string id, Tenant tenant)
        {
            var existingTenant = _tenants.FirstOrDefault(t => t.Id == id);
            if (existingTenant == null) return Task.FromResult<Tenant?>(null);

            existingTenant.Name = tenant.Name;
            existingTenant.Email = tenant.Email;
            existingTenant.Phone = tenant.Phone;
            existingTenant.PropertyId = tenant.PropertyId;
            existingTenant.LeaseStart = tenant.LeaseStart;
            existingTenant.LeaseEnd = tenant.LeaseEnd;
            existingTenant.RentAmount = tenant.RentAmount;
            existingTenant.Deposit = tenant.Deposit;
            existingTenant.Status = tenant.Status;
            existingTenant.UpdatedAt = DateTime.UtcNow;

            return Task.FromResult<Tenant?>(existingTenant);
        }

        public Task<bool> DeleteTenantAsync(string id)
        {
            var tenant = _tenants.FirstOrDefault(t => t.Id == id);
            if (tenant == null) return Task.FromResult(false);

            _tenants.Remove(tenant);
            return Task.FromResult(true);
        }

        // Payments
        public Task<List<Payment>> GetPaymentsAsync()
        {
            return Task.FromResult(_payments.OrderByDescending(p => p.Date).ToList());
        }

        public Task<Payment?> GetPaymentAsync(string id)
        {
            var payment = _payments.FirstOrDefault(p => p.Id == id);
            return Task.FromResult(payment);
        }

        public Task<Payment> CreatePaymentAsync(Payment payment)
        {
            payment.Id = Guid.NewGuid().ToString();
            payment.CreatedAt = DateTime.UtcNow;
            payment.UpdatedAt = DateTime.UtcNow;
            _payments.Add(payment);
            return Task.FromResult(payment);
        }

        public Task<Payment?> UpdatePaymentAsync(string id, Payment payment)
        {
            var existingPayment = _payments.FirstOrDefault(p => p.Id == id);
            if (existingPayment == null) return Task.FromResult<Payment?>(null);

            existingPayment.TenantId = payment.TenantId;
            existingPayment.Amount = payment.Amount;
            existingPayment.Date = payment.Date;
            existingPayment.Method = payment.Method;
            existingPayment.Status = payment.Status;
            existingPayment.Notes = payment.Notes;
            existingPayment.UpdatedAt = DateTime.UtcNow;

            return Task.FromResult<Payment?>(existingPayment);
        }

        public Task<bool> DeletePaymentAsync(string id)
        {
            var payment = _payments.FirstOrDefault(p => p.Id == id);
            if (payment == null) return Task.FromResult(false);

            _payments.Remove(payment);
            return Task.FromResult(true);
        }

        // Contracts
        public Task<List<Contract>> GetContractsAsync()
        {
            return Task.FromResult(_contracts.OrderByDescending(c => c.UploadedAt).ToList());
        }

        public Task<Contract?> GetContractAsync(string id)
        {
            var contract = _contracts.FirstOrDefault(c => c.Id == id);
            return Task.FromResult(contract);
        }

        public Task<List<Contract>> GetContractsByPropertyIdAsync(string propertyId)
        {
            var contracts = _contracts.Where(c => c.PropertyId == propertyId).OrderByDescending(c => c.UploadedAt).ToList();
            return Task.FromResult(contracts);
        }

        public Task<List<Contract>> GetContractsByTenantIdAsync(string tenantId)
        {
            var contracts = _contracts.Where(c => c.TenantId == tenantId).OrderByDescending(c => c.UploadedAt).ToList();
            return Task.FromResult(contracts);
        }

        public Task<Contract> CreateContractAsync(Contract contract)
        {
            contract.Id = Guid.NewGuid().ToString();
            contract.UploadedAt = DateTime.UtcNow;
            _contracts.Add(contract);
            return Task.FromResult(contract);
        }

        public Task<Contract?> UpdateContractAsync(string id, Contract contract)
        {
            var existingContract = _contracts.FirstOrDefault(c => c.Id == id);
            if (existingContract == null) return Task.FromResult<Contract?>(null);

            existingContract.PropertyId = contract.PropertyId;
            existingContract.TenantId = contract.TenantId;
            existingContract.Status = contract.Status;
            existingContract.SignedAt = contract.SignedAt;
            existingContract.Notes = contract.Notes;

            return Task.FromResult<Contract?>(existingContract);
        }

        public Task<bool> DeleteContractAsync(string id)
        {
            var contract = _contracts.FirstOrDefault(c => c.Id == id);
            if (contract == null) return Task.FromResult(false);

            _contracts.Remove(contract);
            return Task.FromResult(true);
        }

        // Dashboard
        public Task<DashboardStats> GetDashboardStatsAsync()
        {
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;

            var activeTenants = _tenants.Where(t => t.Status == TenantStatus.Active).ToList();
            var currentMonthPayments = _payments.Where(p => 
                p.Date.Month == currentMonth && 
                p.Date.Year == currentYear &&
                p.Status == PaymentStatus.Completed).ToList();

            var totalMonthlyRent = activeTenants.Sum(t => t.RentAmount);
            var monthlyCollected = currentMonthPayments.Sum(p => p.Amount);

            var recentPayments = _payments
                .OrderByDescending(p => p.Date)
                .Take(5)
                .Select(p => {
                    var tenant = _tenants.FirstOrDefault(t => t.Id == p.TenantId);
                    var property = tenant != null ? _properties.FirstOrDefault(pr => pr.Id == tenant.PropertyId) : null;
                    return new RecentPayment
                    {
                        Id = p.Id,
                        TenantName = tenant?.Name ?? "Unknown Tenant",
                        PropertyName = property?.Name ?? "Unknown Property",
                        Amount = p.Amount,
                        Date = p.Date,
                        Status = p.Status
                    };
                }).ToList();

            var outstandingRentItems = activeTenants.Select(tenant => {
                var tenantCurrentMonthPayments = currentMonthPayments.Where(p => p.TenantId == tenant.Id).Sum(p => p.Amount);
                var amountDue = tenant.RentAmount - tenantCurrentMonthPayments;
                var property = _properties.FirstOrDefault(p => p.Id == tenant.PropertyId);
                
                return new OutstandingRentItem
                {
                    TenantId = tenant.Id,
                    TenantName = tenant.Name,
                    PropertyName = property?.Name ?? "Unknown Property",
                    AmountDue = amountDue,
                    TotalPaid = tenantCurrentMonthPayments,
                    IsOverdue = amountDue > 0 && DateTime.UtcNow.Day > 5
                };
            }).Where(item => item.AmountDue > 0).ToList();

            return Task.FromResult(new DashboardStats
            {
                TotalProperties = _properties.Count,
                ActiveTenants = activeTenants.Count,
                TotalMonthlyRent = totalMonthlyRent,
                MonthlyCollected = monthlyCollected,
                OutstandingRent = totalMonthlyRent - monthlyCollected,
                PendingPayments = _payments.Count(p => p.Status == PaymentStatus.Pending),
                RecentPayments = recentPayments,
                OutstandingRentItems = outstandingRentItems
            });
        }
    }
}