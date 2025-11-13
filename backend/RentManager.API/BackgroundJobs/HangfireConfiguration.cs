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
                var connectionString = configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("DefaultConnection connection string is not configured");

                // Ensure SSL Mode is required for production security
                if (!connectionString.Contains("SSL Mode", StringComparison.OrdinalIgnoreCase))
                {
                    connectionString += ";SSL Mode=Require;Trust Server Certificate=true";
                }
                options.UseNpgsqlConnection(connectionString);
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
            options.Queues = new[] { "critical", "high-priority", "default", "low" };

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

        // Schedule recurring jobs
        ConfigureRecurringJobs();

        return app;
    }

    private static void ConfigureRecurringJobs()
    {
        // Check for overdue payments daily at 9:00 AM UTC
        RecurringJob.AddOrUpdate<Jobs.CheckOverduePaymentsJob>(
            "check-overdue-payments",
            job => job.ExecuteAsync(JobCancellationToken.Null),
            Cron.Daily(9), // Run at 9:00 AM UTC daily
            new RecurringJobOptions
            {
                TimeZone = TimeZoneInfo.Utc
            });

        // Check for lease expirations daily at 9:00 AM UTC
        RecurringJob.AddOrUpdate<Jobs.CheckLeaseExpirationsJob>(
            "check-lease-expirations",
            job => job.ExecuteAsync(JobCancellationToken.Null),
            Cron.Daily(9), // Run at 9:00 AM UTC daily
            new RecurringJobOptions
            {
                TimeZone = TimeZoneInfo.Utc
            });

        // Check for rent payment reminders daily at 9:00 AM UTC
        RecurringJob.AddOrUpdate<Jobs.CheckRentPaymentRemindersJob>(
            "check-rent-payment-reminders",
            job => job.ExecuteAsync(JobCancellationToken.Null),
            Cron.Daily(9), // Run at 9:00 AM UTC daily
            new RecurringJobOptions
            {
                TimeZone = TimeZoneInfo.Utc
            });
    }
}
