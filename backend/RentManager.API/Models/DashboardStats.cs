namespace RentManager.API.Models
{
    public class DashboardStats
    {
        public int TotalProperties { get; set; }
        public int ActiveTenants { get; set; }
        public decimal TotalMonthlyRent { get; set; }
        public decimal MonthlyCollected { get; set; }
        public decimal OutstandingRent { get; set; }
        public int PendingPayments { get; set; }
        public List<RecentPayment> RecentPayments { get; set; } = new();
        public List<OutstandingRentItem> OutstandingRentItems { get; set; } = new();
    }
}