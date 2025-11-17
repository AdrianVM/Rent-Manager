# Rent-Manager Backend API

.NET 9.0 Web API for the Rent-Manager application with PostgreSQL database support.

## Features

- ✅ Entity Framework Core 9.0 with PostgreSQL
- ✅ JWT Authentication
- ✅ RESTful API with Swagger documentation
- ✅ Support for both in-memory and PostgreSQL data storage
- ✅ Comprehensive database migrations
- ✅ Role-based user management (Admin, Property Owner, Renter)
- ✅ Property, Tenant, Payment, and Contract management
- ✅ Tenant onboarding with invitation system

## Tech Stack

- **.NET 9.0**
- **Entity Framework Core 9.0**
- **PostgreSQL** (via Npgsql.EntityFrameworkCore.PostgreSQL 9.0.4)
- **JWT Authentication** (Microsoft.AspNetCore.Authentication.JwtBearer)
- **Swagger/OpenAPI** for API documentation

## Quick Start

### Prerequisites

- .NET 9.0 SDK
- PostgreSQL 13+ (optional, can use in-memory storage)

### Running with In-Memory Storage (Development)

```bash
cd RentManager.API
dotnet run
```

Navigate to: `http://localhost:5000/swagger`

### Running with PostgreSQL

1. **Set up PostgreSQL database:**

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

Quick setup:
```bash
# Create database
sudo -u postgres psql
CREATE DATABASE rentmanager;
CREATE USER rentmanager_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE rentmanager TO rentmanager_user;
\q
```

2. **Update configuration:**

Edit `appsettings.json`:
```json
{
  "UsePostgres": true,
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=rentmanager;Username=rentmanager_user;Password=your_password"
  }
}
```

3. **Apply migrations:**

```bash
cd RentManager.API
dotnet ef database update
```

4. **Run the application:**

```bash
dotnet run
```

## Project Structure

```
RentManager.API/
├── Controllers/          # API endpoints
│   ├── AuthController.cs
│   ├── PropertiesController.cs
│   ├── PaymentsController.cs
│   ├── ContractsController.cs
│   ├── DashboardController.cs
│   └── SeedController.cs
├── Models/              # Data models
│   ├── User.cs
│   ├── Property.cs
│   ├── Tenant.cs
│   ├── Payment.cs
│   ├── Contract.cs
│   └── TenantInvitation.cs
├── Services/            # Business logic
│   ├── IDataService.cs
│   ├── InMemoryDataService.cs     # In-memory implementation
│   ├── PostgresDataService.cs     # PostgreSQL implementation
│   ├── IAuthService.cs
│   ├── AuthService.cs
│   └── SeedDataService.cs
├── Data/                # Database context and migrations
│   ├── RentManagerDbContext.cs
│   └── Migrations/
│       ├── 20251017203001_InitialCreate.cs
│       └── ...
└── Program.cs           # Application entry point
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - List all properties
- `GET /api/properties/{id}` - Get property by ID
- `POST /api/properties` - Create property
- `PUT /api/properties/{id}` - Update property
- `DELETE /api/properties/{id}` - Delete property

### Payments
- `GET /api/payments` - List all payments
- `GET /api/payments/{id}` - Get payment by ID
- `POST /api/payments` - Record payment
- `PUT /api/payments/{id}` - Update payment
- `DELETE /api/payments/{id}` - Delete payment

### Contracts
- `GET /api/contracts` - List all contracts
- `GET /api/contracts/{id}` - Get contract by ID
- `POST /api/contracts` - Upload contract
- `PUT /api/contracts/{id}` - Update contract
- `DELETE /api/contracts/{id}` - Delete contract

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Seed Data
- `POST /api/seed` - Load demo data (development only)

## Configuration

### appsettings.json

```json
{
  "UsePostgres": false,  // Toggle between in-memory and PostgreSQL
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=rentmanager;Username=postgres;Password=postgres"
  },
  "JwtSettings": {
    "SecretKey": "your-super-secret-key-that-is-at-least-32-characters-long",
    "Issuer": "RentManager",
    "Audience": "RentManager",
    "ExpiryMinutes": 1440
  },
  "FrontendUrl": "http://localhost:3000"
}
```

### Environment Variables

For production, use environment variables:

```bash
export UsePostgres=true
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=rentmanager;Username=user;Password=pass"
export JwtSettings__SecretKey="your-secure-secret-key"
```

## Database Schema

The application uses the following tables:

- **users** - User accounts with roles and authentication
- **properties** - Rental properties (apartments, houses, condos, etc.)
- **tenants** - Tenant information (supports both Person and Company types)
- **payments** - Payment records for rent
- **contracts** - Lease contract documents (stored as base64)
- **tenant_invitations** - Onboarding invitations for new tenants

For detailed schema information, see [DATABASE_SETUP.md](./DATABASE_SETUP.md).

## Migrations

### Create a new migration
```bash
dotnet ef migrations add MigrationName --output-dir Data/Migrations
```

### Apply migrations
```bash
dotnet ef database update
```

### Rollback migration
```bash
dotnet ef database update PreviousMigrationName
```

### Generate SQL script
```bash
dotnet ef migrations script
```

For more migration commands, see [DATABASE_SETUP.md](./DATABASE_SETUP.md).

## Testing

```bash
cd ../RentManager.Tests
dotnet test
```

## Development

### Building
```bash
dotnet build
```

### Running
```bash
dotnet run
```

### Watching (auto-reload)
```bash
dotnet watch run
```

## Authentication

The API uses JWT bearer tokens. To access protected endpoints:

1. Register or login to get a token
2. Include the token in requests: `Authorization: Bearer <token>`

Example:
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token in requests
curl http://localhost:5000/api/properties \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## CORS

CORS is configured to allow requests from `http://localhost:3000` (frontend).

To modify allowed origins, update `Program.cs`:

```csharp
policy.WithOrigins("http://localhost:3000", "https://yourproductiondomain.com")
```

## Production Deployment

### Security Checklist

- [ ] Use strong JWT secret key (stored in environment variables)
- [ ] Use secure database credentials
- [ ] Enable HTTPS only
- [ ] Configure proper CORS origins
- [ ] Use connection pooling
- [ ] Set up database backups
- [ ] Enable logging and monitoring
- [ ] Use read replicas for scaling (if needed)

### Docker Support (Coming Soon)

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "RentManager.API.dll"]
```

## Troubleshooting

### Build Errors
```bash
dotnet clean
dotnet restore
dotnet build
```

### Database Connection Issues
- Verify PostgreSQL is running: `systemctl status postgresql`
- Test connection: `psql -h localhost -U rentmanager_user -d rentmanager`
- Check connection string in appsettings.json

### Migration Errors
- Ensure database exists
- Verify user permissions
- Check [DATABASE_SETUP.md](./DATABASE_SETUP.md) for troubleshooting

## Resources

- [Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core/)
- [ASP.NET Core Web API](https://docs.microsoft.com/en-us/aspnet/core/web-api/)
- [Npgsql EF Core Provider](https://www.npgsql.org/efcore/)

## License

MIT

## Contributors

Generated with Claude Code on 2025-10-17
