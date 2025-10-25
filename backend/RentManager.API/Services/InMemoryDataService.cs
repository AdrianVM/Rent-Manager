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
        public Task<List<Property>> GetPropertiesAsync(User? user = null)
        {
            if (user == null || user.HasRole(Role.Admin))
            {
                return Task.FromResult(_properties);
            }
            
            if (user.HasRole(Role.PropertyOwner))
            {
                var ownerProperties = _properties.Where(p => user.PropertyIds.Contains(p.Id)).ToList();
                return Task.FromResult(ownerProperties);
            }
            
            if (user.HasRole(Role.Renter) && !string.IsNullOrEmpty(user.PersonId))
            {
                var tenant = _tenants.FirstOrDefault(t => t.PersonId == user.PersonId);
                if (tenant != null)
                {
                    var renterProperty = _properties.Where(p => p.Id == tenant.PropertyId).ToList();
                    return Task.FromResult(renterProperty);
                }
            }
            
            return Task.FromResult(new List<Property>());
        }

        public Task<Property?> GetPropertyAsync(string id, User? user = null)
        {
            var property = _properties.FirstOrDefault(p => p.Id == id);
            if (property == null) return Task.FromResult<Property?>(null);
            
            if (user == null || user.HasRole(Role.Admin))
            {
                return Task.FromResult<Property?>(property);
            }
            
            if (user.HasRole(Role.PropertyOwner) && user.PropertyIds.Contains(id))
            {
                return Task.FromResult<Property?>(property);
            }
            
            if (user.HasRole(Role.Renter) && !string.IsNullOrEmpty(user.PersonId))
            {
                var tenant = _tenants.FirstOrDefault(t => t.PersonId == user.PersonId);
                if (tenant != null && tenant.PropertyId == id)
                {
                    return Task.FromResult<Property?>(property);
                }
            }
            
            return Task.FromResult<Property?>(null);
        }

        public Task<Property> CreatePropertyAsync(Property property, User? user = null)
        {
            property.Id = Guid.NewGuid().ToString();
            property.CreatedAt = DateTime.UtcNow;
            property.UpdatedAt = DateTime.UtcNow;
            _properties.Add(property);
            return Task.FromResult(property);
        }

        public Task<Property?> UpdatePropertyAsync(string id, Property property, User? user = null)
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

        public Task<bool> DeletePropertyAsync(string id, User? user = null)
        {
            var property = _properties.FirstOrDefault(p => p.Id == id);
            if (property == null) return Task.FromResult(false);

            _properties.Remove(property);
            return Task.FromResult(true);
        }

        // Tenants
        public Task<List<Tenant>> GetTenantsAsync(User? user = null)
        {
            if (user == null || user.HasRole(Role.Admin))
            {
                return Task.FromResult(_tenants);
            }
            
            if (user.HasRole(Role.PropertyOwner))
            {
                var ownerTenants = _tenants.Where(t => user.PropertyIds.Contains(t.PropertyId)).ToList();
                return Task.FromResult(ownerTenants);
            }
            
            if (user.HasRole(Role.Renter) && !string.IsNullOrEmpty(user.PersonId))
            {
                var renterTenant = _tenants.Where(t => t.PersonId == user.PersonId).ToList();
                return Task.FromResult(renterTenant);
            }
            
            return Task.FromResult(new List<Tenant>());
        }

        public Task<Tenant?> GetTenantAsync(string id, User? user = null)
        {
            var tenant = _tenants.FirstOrDefault(t => t.Id == id);
            return Task.FromResult(tenant);
        }

        public Task<Tenant> CreateTenantAsync(Tenant tenant, User? user = null)
        {
            tenant.Id = Guid.NewGuid().ToString();
            tenant.CreatedAt = DateTime.UtcNow;
            tenant.UpdatedAt = DateTime.UtcNow;
            _tenants.Add(tenant);
            return Task.FromResult(tenant);
        }

        public Task<Tenant?> UpdateTenantAsync(string id, Tenant tenant, User? user = null)
        {
            var existingTenant = _tenants.FirstOrDefault(t => t.Id == id);
            if (existingTenant == null) return Task.FromResult<Tenant?>(null);

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

            return Task.FromResult<Tenant?>(existingTenant);
        }

        public Task<bool> DeleteTenantAsync(string id, User? user = null)
        {
            var tenant = _tenants.FirstOrDefault(t => t.Id == id);
            if (tenant == null) return Task.FromResult(false);

            _tenants.Remove(tenant);
            return Task.FromResult(true);
        }

        // Payments
        public Task<List<Payment>> GetPaymentsAsync(User? user = null)
        {
            var payments = _payments.OrderByDescending(p => p.Date).ToList();
            
            if (user == null || user.HasRole(Role.Admin))
            {
                return Task.FromResult(payments);
            }
            
            if (user.HasRole(Role.PropertyOwner))
            {
                var ownerTenantIds = _tenants.Where(t => user.PropertyIds.Contains(t.PropertyId)).Select(t => t.Id).ToList();
                var ownerPayments = payments.Where(p => ownerTenantIds.Contains(p.TenantId)).ToList();
                return Task.FromResult(ownerPayments);
            }
            
            if (user.HasRole(Role.Renter) && !string.IsNullOrEmpty(user.PersonId))
            {
                var tenant = _tenants.FirstOrDefault(t => t.PersonId == user.PersonId);
                if (tenant != null)
                {
                    var renterPayments = payments.Where(p => p.TenantId == tenant.Id).ToList();
                    return Task.FromResult(renterPayments);
                }
            }
            
            return Task.FromResult(new List<Payment>());
        }

        public Task<Payment?> GetPaymentAsync(string id, User? user = null)
        {
            var payment = _payments.FirstOrDefault(p => p.Id == id);
            return Task.FromResult(payment);
        }

        public Task<Payment> CreatePaymentAsync(Payment payment, User? user = null)
        {
            payment.Id = Guid.NewGuid().ToString();
            payment.CreatedAt = DateTime.UtcNow;
            payment.UpdatedAt = DateTime.UtcNow;
            _payments.Add(payment);
            return Task.FromResult(payment);
        }

        public Task<Payment?> UpdatePaymentAsync(string id, Payment payment, User? user = null)
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

        public Task<bool> DeletePaymentAsync(string id, User? user = null)
        {
            var payment = _payments.FirstOrDefault(p => p.Id == id);
            if (payment == null) return Task.FromResult(false);

            _payments.Remove(payment);
            return Task.FromResult(true);
        }

        // Contracts
        public Task<List<Contract>> GetContractsAsync(User? user = null)
        {
            var contracts = _contracts.OrderByDescending(c => c.UploadedAt).ToList();
            
            if (user == null || user.HasRole(Role.Admin))
            {
                return Task.FromResult(contracts);
            }
            
            if (user.HasRole(Role.PropertyOwner))
            {
                var ownerContracts = contracts.Where(c => user.PropertyIds.Contains(c.PropertyId)).ToList();
                return Task.FromResult(ownerContracts);
            }
            
            if (user.HasRole(Role.Renter) && !string.IsNullOrEmpty(user.PersonId))
            {
                var tenant = _tenants.FirstOrDefault(t => t.PersonId == user.PersonId);
                if (tenant != null)
                {
                    var renterContracts = contracts.Where(c => c.TenantId == tenant.Id).ToList();
                    return Task.FromResult(renterContracts);
                }
            }
            
            return Task.FromResult(new List<Contract>());
        }

        public Task<Contract?> GetContractAsync(string id, User? user = null)
        {
            var contract = _contracts.FirstOrDefault(c => c.Id == id);
            return Task.FromResult(contract);
        }

        public Task<List<Contract>> GetContractsByPropertyIdAsync(string propertyId, User? user = null)
        {
            var contracts = _contracts.Where(c => c.PropertyId == propertyId).OrderByDescending(c => c.UploadedAt).ToList();
            return Task.FromResult(contracts);
        }

        public Task<List<Contract>> GetContractsByTenantIdAsync(string tenantId, User? user = null)
        {
            var contracts = _contracts.Where(c => c.TenantId == tenantId).OrderByDescending(c => c.UploadedAt).ToList();
            return Task.FromResult(contracts);
        }

        public Task<Contract> CreateContractAsync(Contract contract, User? user = null)
        {
            contract.Id = Guid.NewGuid().ToString();
            contract.UploadedAt = DateTime.UtcNow;
            _contracts.Add(contract);
            return Task.FromResult(contract);
        }

        public Task<Contract?> UpdateContractAsync(string id, Contract contract, User? user = null)
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

        public Task<bool> DeleteContractAsync(string id, User? user = null)
        {
            var contract = _contracts.FirstOrDefault(c => c.Id == id);
            if (contract == null) return Task.FromResult(false);

            _contracts.Remove(contract);
            return Task.FromResult(true);
        }

        // Dashboard
        public Task<DashboardStats> GetDashboardStatsAsync(User? user = null)
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