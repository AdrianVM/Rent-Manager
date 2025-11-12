using Hangfire.Dashboard;

namespace RentManager.API.BackgroundJobs;

/// <summary>
/// Custom authorization filter for Hangfire Dashboard
/// Only allows authenticated users with Admin role to access the dashboard
/// </summary>
public class HangfireDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        // Only allow authenticated users with Admin role
        // Adjust based on your authorization requirements
        return httpContext.User.Identity?.IsAuthenticated == true
            && httpContext.User.IsInRole("Admin");
    }
}
