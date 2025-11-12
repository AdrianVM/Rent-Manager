using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RentManager.API.Data;
using RentManager.API.Services;
using RentManager.API.BackgroundJobs;

var builder = WebApplication.CreateBuilder(args);

// Load local configuration file if it exists (for secrets like Stripe keys)
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Accept camelCase JSON from frontend
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        // Convert enums to camelCase strings
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase));
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

// Configure PostgreSQL Database
builder.Services.AddDbContext<RentManagerDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register services
// Toggle between InMemoryDataService and PostgresDataService based on configuration
var usePostgres = builder.Configuration.GetValue<bool>("UsePostgres", false);
if (usePostgres)
{
    builder.Services.AddScoped<IDataService, PostgresDataService>();
}
else
{
    builder.Services.AddSingleton<IDataService, InMemoryDataService>();
}

builder.Services.AddScoped<IAuthService, AuthService>();

// Configure Stripe
builder.Services.Configure<RentManager.API.Services.PaymentGateway.StripeSettings>(
    builder.Configuration.GetSection("Stripe"));
builder.Services.AddScoped<RentManager.API.Services.PaymentGateway.IPaymentGateway, RentManager.API.Services.PaymentGateway.StripePaymentGateway>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

// Configure Email Service
builder.Services.AddHttpClient(); // Required for ScalewayEmailService
builder.Services.Configure<RentManager.API.Services.Email.ScalewayEmailSettings>(
    builder.Configuration.GetSection("ScalewayEmail"));
builder.Services.AddScoped<RentManager.API.Services.Email.IEmailService, RentManager.API.Services.Email.ScalewayEmailService>();
builder.Services.AddScoped<RentManager.API.Services.Email.IEmailTemplateService, RentManager.API.Services.Email.EmailTemplateService>();

builder.Services.AddScoped<SeedDataService>();

// Add Hangfire background jobs
builder.Services.AddHangfireBackgroundJobs(builder.Configuration);

// Zitadel OAuth Configuration
var zitadelSettings = builder.Configuration.GetSection("Zitadel");
var zitadelAuthority = zitadelSettings["Authority"];
var zitadelAudience = zitadelSettings["Audience"];

if (string.IsNullOrEmpty(zitadelAuthority) || zitadelAuthority == "your-authority")
{
    throw new InvalidOperationException("Zitadel Authority must be configured in appsettings.json or environment variables");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = zitadelAuthority;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidIssuer = zitadelAuthority,
            ValidAudience = zitadelAudience,
            // Zitadel tokens can have multiple audiences
            ValidAudiences = new[] { zitadelAudience ?? "", builder.Configuration["FrontendUrl"] ?? "" },
            // For Zitadel, we validate the signing key from the OIDC discovery document
            ValidateIssuerSigningKey = true
        };

        // Allow HTTP for local development
        if (builder.Environment.IsDevelopment())
        {
            options.RequireHttpsMetadata = false;
        }
    });

builder.Services.AddAuthorization();

// Add claims transformation to map Zitadel roles to standard .NET role claims
builder.Services.AddTransient<Microsoft.AspNetCore.Authentication.IClaimsTransformation, ZitadelClaimsTransformation>();

// Add CORS for frontend
var frontendUrl = builder.Configuration["FrontendUrl"];
var allowedOrigins = new List<string> { "http://localhost:3000" };

if (!string.IsNullOrEmpty(frontendUrl) && frontendUrl != "your-fe-url")
{
    allowedOrigins.Add(frontendUrl);
}

// Log the configured origins for debugging
Console.WriteLine($"[CORS] Configured allowed origins: {string.Join(", ", allowedOrigins)}");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// Configure Hangfire Dashboard
app.UseHangfireConfiguration(builder.Configuration);

// Redirect root to Swagger UI
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

app.MapControllers();
app.MapHealthChecks("/health");

// Configure recurring background jobs
JobScheduler.ConfigureRecurringJobs();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

// Make Program class public for testing
public partial class Program { }
