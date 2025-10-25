using RentManager.API.Models;

namespace RentManager.API.Services
{
    public interface IDataService
    {
        // Properties
        Task<List<Property>> GetPropertiesAsync(User? user = null);
        Task<Property?> GetPropertyAsync(string id, User? user = null);
        Task<Property> CreatePropertyAsync(Property property, User? user = null);
        Task<Property?> UpdatePropertyAsync(string id, Property property, User? user = null);
        Task<bool> DeletePropertyAsync(string id, User? user = null);

        // Persons
        Task<Person> CreatePersonAsync(Person person);
        Task<Person?> GetPersonAsync(string id);

        // Tenants
        Task<List<Tenant>> GetTenantsAsync(User? user = null);
        Task<Tenant?> GetTenantAsync(string id, User? user = null);
        Task<Tenant> CreateTenantAsync(Tenant tenant, User? user = null);
        Task<Tenant?> UpdateTenantAsync(string id, Tenant tenant, User? user = null);
        Task<bool> DeleteTenantAsync(string id, User? user = null);

        // Payments
        Task<List<Payment>> GetPaymentsAsync(User? user = null);
        Task<Payment?> GetPaymentAsync(string id, User? user = null);
        Task<Payment> CreatePaymentAsync(Payment payment, User? user = null);
        Task<Payment?> UpdatePaymentAsync(string id, Payment payment, User? user = null);
        Task<bool> DeletePaymentAsync(string id, User? user = null);

        // Contracts
        Task<List<Contract>> GetContractsAsync(User? user = null);
        Task<Contract?> GetContractAsync(string id, User? user = null);
        Task<List<Contract>> GetContractsByPropertyIdAsync(string propertyId, User? user = null);
        Task<List<Contract>> GetContractsByTenantIdAsync(string tenantId, User? user = null);
        Task<Contract> CreateContractAsync(Contract contract, User? user = null);
        Task<Contract?> UpdateContractAsync(string id, Contract contract, User? user = null);
        Task<bool> DeleteContractAsync(string id, User? user = null);

        // Dashboard
        Task<DashboardStats> GetDashboardStatsAsync(User? user = null);
    }
}