using Hangfire;
using Hangfire.PostgreSql;

namespace RentManager.API.BackgroundJobs;

public static class HangfireConfiguration
{
    public static IServiceCollection AddHangfireBackgroundJobs(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Add Hangfire services with PostgreSQL storage
        services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(options =>
            {
                options.UseNpgsqlConnection(
                    configuration.GetConnectionString("DefaultConnection"));
            }, new PostgreSqlStorageOptions
            {
                // Hangfire will create tables in a separate schema
                SchemaName = "hangfire",

                // Optimize for your job frequency
                QueuePollInterval = TimeSpan.FromSeconds(15),

                // Job expiration settings
                JobExpirationCheckInterval = TimeSpan.FromHours(1),
                CountersAggregateInterval = TimeSpan.FromMinutes(5),

                // Enable distributed locks for multiple instances
                DistributedLockTimeout = TimeSpan.FromMinutes(10),

                // Connection pooling optimization
                PrepareSchemaIfNecessary = true
            }));

        // Add Hangfire processing server
        services.AddHangfireServer(options =>
        {
            // Server name for identification in dashboard
            options.ServerName = $"RentManager-{Environment.MachineName}";

            // Number of concurrent jobs
            options.WorkerCount = Environment.ProcessorCount * 2;

            // Queue names (for job prioritization)
            options.Queues = new[] { "critical", "default", "low" };

            // Shutdown timeout
            options.ShutdownTimeout = TimeSpan.FromMinutes(5);

            // Schedule polling interval
            options.SchedulePollingInterval = TimeSpan.FromSeconds(30);
        });

        return services;
    }

    public static IApplicationBuilder UseHangfireConfiguration(
        this IApplicationBuilder app,
        IConfiguration configuration)
    {
        // Configure Hangfire Dashboard with authentication
        var dashboardOptions = new DashboardOptions
        {
            // Dashboard path: /hangfire
            Authorization = new[] { new HangfireDashboardAuthorizationFilter() },

            // Display storage connection info
            DisplayStorageConnectionString = false,

            // Stats polling interval
            StatsPollingInterval = 10000, // 10 seconds

            // Dashboard title
            DashboardTitle = "Rent Manager - Background Jobs"
        };

        app.UseHangfireDashboard("/hangfire", dashboardOptions);

        return app;
    }
}
