using RentManager.API.Models;

namespace RentManager.API.Services
{
    public interface IDataService
    {
        // Properties
        Task<List<Property>> GetPropertiesAsync();
        Task<Property?> GetPropertyAsync(string id);
        Task<Property> CreatePropertyAsync(Property property);
        Task<Property?> UpdatePropertyAsync(string id, Property property);
        Task<bool> DeletePropertyAsync(string id);

        // Tenants
        Task<List<Tenant>> GetTenantsAsync();
        Task<Tenant?> GetTenantAsync(string id);
        Task<Tenant> CreateTenantAsync(Tenant tenant);
        Task<Tenant?> UpdateTenantAsync(string id, Tenant tenant);
        Task<bool> DeleteTenantAsync(string id);

        // Payments
        Task<List<Payment>> GetPaymentsAsync();
        Task<Payment?> GetPaymentAsync(string id);
        Task<Payment> CreatePaymentAsync(Payment payment);
        Task<Payment?> UpdatePaymentAsync(string id, Payment payment);
        Task<bool> DeletePaymentAsync(string id);

        // Dashboard
        Task<DashboardStats> GetDashboardStatsAsync();
    }
}