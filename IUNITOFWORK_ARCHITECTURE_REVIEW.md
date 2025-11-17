# IUnitOfWork Architecture Review - Rent Manager Project

**Review Date:** 2025-11-17
**Reviewer:** Backend Architect
**Project:** Rent Manager (.NET 8 Rental Property Management Application)
**Files Reviewed:**
- `/home/adrian/IT Projects/Rent-Manager/backend/RentManager.API/Data/IUnitOfWork.cs`
- `/home/adrian/IT Projects/Rent-Manager/backend/RentManager.API/Data/RentManagerDbContext.cs`
- `/home/adrian/IT Projects/Rent-Manager/backend/RentManager.API/Services/PostgresDataService.cs`
- Various controllers and services

---

## Executive Summary

**CRITICAL ISSUES IDENTIFIED:** The current IUnitOfWork implementation has **SEVERE architectural flaws** that violate fundamental design patterns and best practices. This implementation is a **misuse of the Unit of Work pattern** and creates significant technical debt, maintainability issues, and potential runtime bugs.

**Severity Level:** HIGH - Immediate refactoring recommended

**Key Findings:**
1. IUnitOfWork is **NOT** a Unit of Work - it's a Database Context Abstraction
2. Infinite recursion bug in `SaveChangesAsync()` implementation
3. Violation of Interface Segregation Principle (ISP)
4. Inconsistent usage across the codebase
5. Missing transaction management capabilities
6. No repository pattern implementation
7. Direct DbSet exposure violates encapsulation

---

## 1. Pattern Misidentification - Not a True Unit of Work

### Current Implementation Analysis

```csharp
public interface IUnitOfWork
{
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    // ... 16 more DbSets
    public Task SaveChangesAsync();
}

public class RentManagerDbContext : DbContext, IUnitOfWork
{
    // Direct implementation
}
```

### The Problem

**This is NOT a Unit of Work pattern - it's a DbContext abstraction.**

The Unit of Work pattern has specific responsibilities:
- Coordinate work across multiple repositories
- Manage transactions explicitly
- Track changes across aggregate roots
- Provide transactional boundaries

What you've implemented is:
- A direct exposure of DbSet properties
- A thin wrapper around DbContext
- No abstraction value - consumers still use EF Core APIs directly

### What a True Unit of Work Should Look Like

```csharp
public interface IUnitOfWork : IDisposable
{
    // Repository access - NOT DbSets
    IRepository<User> Users { get; }
    IRepository<Property> Properties { get; }
    IRepository<Payment> Payments { get; }

    // Transaction management
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();

    // Advanced features
    Task<IDbContextTransaction> BeginTransactionAsync(IsolationLevel isolationLevel);
}
```

---

## 2. CRITICAL BUG: Infinite Recursion in SaveChangesAsync

### Location: RentManagerDbContext.cs, Line 34-37

```csharp
public async Task SaveChangesAsync()
{
    await this.SaveChangesAsync();  // INFINITE RECURSION!
}
```

### The Issue

This method calls itself recursively without a base case, causing a **StackOverflowException** at runtime.

### Why It Hasn't Failed Yet

You're likely calling `_context.SaveChangesAsync()` from the base `DbContext` (inherited method) in your services, not the interface method. Example from DataRetentionService.cs:

```csharp
await _context.SaveChangesAsync();  // Calls DbContext.SaveChangesAsync(), not IUnitOfWork.SaveChangesAsync()
```

This is working **by accident**, not by design.

### The Fix

```csharp
public async Task SaveChangesAsync()
{
    await base.SaveChangesAsync();  // Call the DbContext method
}
```

Or better - accept a CancellationToken:

```csharp
Task IUnitOfWork.SaveChangesAsync(CancellationToken cancellationToken = default)
{
    return base.SaveChangesAsync(cancellationToken);
}
```

---

## 3. Architectural Anti-Patterns Identified

### 3.1 Violation of Interface Segregation Principle (ISP)

The IUnitOfWork interface exposes **18 DbSet properties**. This creates:

**Problem 1: Massive Interface Pollution**
```csharp
// A service that only needs Users is forced to depend on ALL entities
public class AuthService : IAuthService
{
    private readonly IUnitOfWork _context;  // Has access to Payments, Properties, etc.

    public AuthService(IUnitOfWork context)  // Receives entire database!
    {
        _context = context;
    }
}
```

**Problem 2: Violation of Dependency Inversion**
Services should depend on abstractions of **what they need**, not the entire database.

**Correct Approach:**
```csharp
public class AuthService : IAuthService
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Role> _roleRepository;

    public AuthService(IRepository<User> userRepository, IRepository<Role> roleRepository)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
    }
}
```

### 3.2 Inconsistent Service Layer Usage

**Observation:** You have **TWO competing data access patterns**:

#### Pattern 1: PostgresDataService (IDataService)
```csharp
public class PostgresDataService : IDataService
{
    private readonly IUnitOfWork _context;  // Uses IUnitOfWork

    public async Task<User?> GetUserByIdAsync(string id)
    {
        return await _context.Users
            .Include(u => u.Person)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);
    }
}
```

#### Pattern 2: Direct DbContext in Services
```csharp
public class DataRetentionService : IDataRetentionService
{
    private readonly RentManagerDbContext _context;  // Uses concrete DbContext

    public async Task<List<DataRetentionSchedule>> GetRetentionSchedulesAsync()
    {
        return await _context.DataRetentionSchedules
            .OrderBy(s => s.DataCategory)
            .ToListAsync();
    }
}
```

#### Pattern 3: Even More Direct DbContext
```csharp
public class PaymentService : IPaymentService
{
    private readonly RentManagerDbContext _context;  // Direct dependency

    public async Task<List<Payment>> GetPaymentsAsync(User? user = null)
    {
        var query = _context.Payments.AsQueryable();
        // ...
    }
}
```

**This inconsistency creates:**
- Confusion for developers
- Difficult testing (some services are easier to mock than others)
- No clear architectural boundaries
- Maintenance burden

### 3.3 Missing Repository Pattern

Your current approach exposes raw `DbSet<T>` objects, which means:

**Problem:** Services contain EF Core query logic
```csharp
// In PostgresDataService.cs
return await _context.Users
    .Include(u => u.Person)
    .Include(u => u.UserRoles)
        .ThenInclude(ur => ur.Role)
    .FirstOrDefaultAsync(u => u.Id == id);
```

**Better:** Repository encapsulates query logic
```csharp
// In UserRepository.cs
public async Task<User?> GetByIdWithDetailsAsync(string id)
{
    return await _dbSet
        .Include(u => u.Person)
        .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
        .FirstOrDefaultAsync(u => u.Id == id);
}
```

---

## 4. Transaction Management Issues

### Current State: NO Explicit Transaction Support

Your IUnitOfWork interface has:
```csharp
public Task SaveChangesAsync();
```

**Missing:**
- Transaction Begin/Commit/Rollback
- Transaction isolation level control
- Multi-operation atomic boundaries

### Real-World Scenario Where This Fails

```csharp
// Example: Processing a refund
public async Task ProcessRefundAsync(string paymentId, decimal amount)
{
    var payment = await _context.Payments.FindAsync(paymentId);
    payment.Status = PaymentStatus.Refunded;
    payment.RefundedAmount = amount;

    // Create audit log
    var auditLog = new DataDeletionLog { ... };
    _context.DataDeletionLogs.Add(auditLog);

    // Update tenant balance
    var tenant = await _context.Tenants.FindAsync(payment.TenantId);
    tenant.Balance += amount;

    await _context.SaveChangesAsync();  // What if this partially fails?
}
```

**Problem:** No explicit transaction boundary. EF Core provides implicit transactions, but:
- You can't control rollback behavior
- You can't span transactions across multiple operations
- You can't use isolation levels for complex scenarios

### What You Need

```csharp
public interface IUnitOfWork
{
    Task<IDbContextTransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted);

    Task CommitAsync();
    Task RollbackAsync();
}

// Usage:
await using var transaction = await _unitOfWork.BeginTransactionAsync();
try
{
    await ProcessRefundAsync(...);
    await CreateAuditLog(...);
    await UpdateTenantBalance(...);

    await _unitOfWork.CommitAsync();
}
catch
{
    await _unitOfWork.RollbackAsync();
    throw;
}
```

---

## 5. Testability Concerns

### Current Mockability Issues

**PostgresDataService is hard to test:**
```csharp
public class PostgresDataService : IDataService
{
    private readonly IUnitOfWork _context;  // Needs EF Core in-memory or real DB

    public async Task<User?> GetUserByIdAsync(string id)
    {
        // Direct EF Core LINQ - requires EF Core provider in tests
        return await _context.Users
            .Include(u => u.Person)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);
    }
}
```

**Testing requires:**
- Setting up EF Core InMemory provider
- Seeding test data into DbSets
- Complex mock setups for Include/ThenInclude

### Better Approach with Repository Pattern

```csharp
// Repository interface
public interface IUserRepository
{
    Task<User?> GetByIdWithDetailsAsync(string id);
    Task<User?> GetByEmailAsync(string email);
    Task<List<User>> GetAllAsync();
}

// Service depends on interface
public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;  // Easy to mock!

    // Test with:
    // var mockRepo = new Mock<IUserRepository>();
    // mockRepo.Setup(r => r.GetByIdAsync("123")).ReturnsAsync(testUser);
}
```

---

## 6. Performance and N+1 Query Issues

### Problem: No Query Optimization Strategy

Services directly use `.Include()` without centralized query optimization:

```csharp
// From PostgresDataService.cs - Line 485-492
return await _context.MaintenanceRequests
    .Include(mr => mr.Tenant)
        .ThenInclude(t => t.Person)
    .Include(mr => mr.Tenant)
        .ThenInclude(t => t.Company)
    .Include(mr => mr.Property)
    .OrderByDescending(mr => mr.CreatedAt)
    .ToListAsync();
```

**Issues:**
- Include logic scattered across service layer
- No centralized place to optimize queries
- Potential for N+1 queries if developers forget `.Include()`
- No specification pattern for reusable query logic

### Better Approach: Specification Pattern

```csharp
public class MaintenanceRequestWithDetailsSpec : Specification<MaintenanceRequest>
{
    public override IQueryable<MaintenanceRequest> Apply(IQueryable<MaintenanceRequest> query)
    {
        return query
            .Include(mr => mr.Tenant)
                .ThenInclude(t => t.Person)
            .Include(mr => mr.Tenant)
                .ThenInclude(t => t.Company)
            .Include(mr => mr.Property)
            .OrderByDescending(mr => mr.CreatedAt);
    }
}

// Usage:
var requests = await _repository.FindAsync(new MaintenanceRequestWithDetailsSpec());
```

---

## 7. GDPR Compliance Concerns

Given your GDPR implementation (data retention, legal holds), the current architecture has risks:

### Issue 1: No Audit Trail for Database Operations

```csharp
// Current approach in services
_context.Users.Remove(user);
await _context.SaveChangesAsync();
```

**No automatic tracking of:**
- Who deleted the data
- When it was deleted
- Why it was deleted (data retention vs user request)

### Issue 2: Legal Hold Enforcement Not Centralized

Legal holds are checked manually in services:

```csharp
// Manual check in DataDeletionService (presumably)
if (await _legalHoldService.IsUserUnderLegalHoldAsync(userId))
{
    throw new InvalidOperationException("Cannot delete - user under legal hold");
}
```

**Problem:** Developers can forget to check, causing compliance violations.

### Better Approach: Interceptors

```csharp
public class LegalHoldInterceptor : SaveChangesInterceptor
{
    private readonly ILegalHoldService _legalHoldService;

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(...)
    {
        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Deleted)
            {
                var userId = ExtractUserId(entry.Entity);
                if (await _legalHoldService.IsUserUnderLegalHoldAsync(userId))
                {
                    throw new InvalidOperationException(
                        $"Cannot delete - user {userId} under legal hold");
                }
            }
        }
        return await base.SavingChangesAsync(...);
    }
}
```

---

## 8. Recommended Architecture

### Option A: Repository + Unit of Work Pattern (Recommended for your project)

```csharp
// 1. Generic Repository Interface
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(string id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
}

// 2. Specific Repository Interfaces
public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdWithRolesAsync(string id);
    Task<List<User>> GetInactiveUsersAsync(int monthsInactive);
}

// 3. Unit of Work Interface
public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IRepository<Property> Properties { get; }
    IRepository<Payment> Payments { get; }
    IRepository<DataRetentionSchedule> RetentionSchedules { get; }
    ILegalHoldRepository LegalHolds { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}

// 4. Implementation
public class UnitOfWork : IUnitOfWork
{
    private readonly RentManagerDbContext _context;
    private IUserRepository? _users;
    private IRepository<Property>? _properties;
    // ... other repositories

    public UnitOfWork(RentManagerDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users =>
        _users ??= new UserRepository(_context);

    public IRepository<Property> Properties =>
        _properties ??= new Repository<Property>(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IDbContextTransaction> BeginTransactionAsync()
    {
        return await _context.Database.BeginTransactionAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
```

### Option B: Simplified Approach - Keep Current Pattern (Not Recommended)

If you choose to keep the current approach (not recommended), at minimum:

**1. Fix the SaveChangesAsync bug:**
```csharp
public async Task SaveChangesAsync()
{
    await base.SaveChangesAsync();  // Add 'base.'
}
```

**2. Rename the interface:**
```csharp
public interface IRentManagerDbContext  // More honest name
{
    DbSet<User> Users { get; set; }
    // ...
    Task SaveChangesAsync();
}
```

**3. Use consistently:**
```csharp
// ALL services should use the interface, not the concrete DbContext
public class DataRetentionService : IDataRetentionService
{
    private readonly IRentManagerDbContext _context;  // Not RentManagerDbContext
}
```

---

## 9. Migration Strategy

### Phase 1: Fix Critical Bugs (Immediate - 1 day)
1. Fix `SaveChangesAsync()` infinite recursion
2. Add CancellationToken support
3. Update all services to use interface consistently

### Phase 2: Add Transaction Support (Short-term - 2-3 days)
1. Add transaction methods to IUnitOfWork
2. Implement transaction management in critical operations
3. Add transaction rollback handling

### Phase 3: Introduce Repository Pattern (Medium-term - 1-2 weeks)
1. Create generic repository interface and implementation
2. Create specific repositories for complex entities (User, Payment, etc.)
3. Update services to use repositories instead of DbSets
4. Maintain backward compatibility during transition

### Phase 4: Full Refactoring (Long-term - 3-4 weeks)
1. Implement complete repository pattern across all entities
2. Remove direct DbSet access from services
3. Implement specification pattern for complex queries
4. Add EF Core interceptors for GDPR compliance

---

## 10. Code Examples for Migration

### Before (Current Code):

```csharp
public class DataRetentionService : IDataRetentionService
{
    private readonly RentManagerDbContext _context;

    public async Task<DataRetentionSchedule?> GetRetentionScheduleByIdAsync(int id)
    {
        return await _context.DataRetentionSchedules.FindAsync(id);
    }

    public async Task<DataRetentionSchedule> CreateRetentionScheduleAsync(
        DataRetentionSchedule schedule)
    {
        schedule.CreatedAt = DateTimeOffset.UtcNow;
        schedule.IsActive = true;

        _context.DataRetentionSchedules.Add(schedule);
        await _context.SaveChangesAsync();

        return schedule;
    }
}
```

### After (With Repository Pattern):

```csharp
public class DataRetentionService : IDataRetentionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DataRetentionService> _logger;

    public DataRetentionService(IUnitOfWork unitOfWork, ILogger<DataRetentionService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<DataRetentionSchedule?> GetRetentionScheduleByIdAsync(int id)
    {
        return await _unitOfWork.RetentionSchedules.GetByIdAsync(id);
    }

    public async Task<DataRetentionSchedule> CreateRetentionScheduleAsync(
        DataRetentionSchedule schedule)
    {
        // Validation
        var existing = await _unitOfWork.RetentionSchedules
            .FindAsync(s => s.DataCategory == schedule.DataCategory);

        if (existing.Any())
        {
            throw new InvalidOperationException(
                $"Retention schedule for '{schedule.DataCategory}' already exists");
        }

        // Business logic
        schedule.CreatedAt = DateTimeOffset.UtcNow;
        schedule.IsActive = true;

        // Persist
        var created = await _unitOfWork.RetentionSchedules.AddAsync(schedule);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation(
            "Created retention schedule {Id} for category {Category}",
            created.Id, created.DataCategory);

        return created;
    }
}
```

---

## 11. Testing Impact

### Current Testing Challenges:

```csharp
[Fact]
public async Task CreateRetentionSchedule_Success()
{
    // HARD: Need to setup EF Core InMemory provider
    var options = new DbContextOptionsBuilder<RentManagerDbContext>()
        .UseInMemoryDatabase(databaseName: "TestDb")
        .Options;

    var context = new RentManagerDbContext(options);
    var service = new DataRetentionService(context, logger);

    // HARD: Need to seed data
    await context.DataRetentionSchedules.AddAsync(existingSchedule);
    await context.SaveChangesAsync();

    // Act
    var result = await service.CreateRetentionScheduleAsync(newSchedule);

    // Assert
    Assert.NotNull(result);
}
```

### With Repository Pattern:

```csharp
[Fact]
public async Task CreateRetentionSchedule_Success()
{
    // EASY: Mock the repository
    var mockUnitOfWork = new Mock<IUnitOfWork>();
    var mockRepository = new Mock<IRepository<DataRetentionSchedule>>();

    mockRepository
        .Setup(r => r.FindAsync(It.IsAny<Expression<Func<DataRetentionSchedule, bool>>>()))
        .ReturnsAsync(new List<DataRetentionSchedule>());  // No existing schedules

    mockRepository
        .Setup(r => r.AddAsync(It.IsAny<DataRetentionSchedule>()))
        .ReturnsAsync((DataRetentionSchedule s) => s);

    mockUnitOfWork
        .Setup(u => u.RetentionSchedules)
        .Returns(mockRepository.Object);

    var service = new DataRetentionService(mockUnitOfWork.Object, logger);

    // Act
    var result = await service.CreateRetentionScheduleAsync(newSchedule);

    // Assert
    Assert.NotNull(result);
    mockRepository.Verify(r => r.AddAsync(It.IsAny<DataRetentionSchedule>()), Times.Once);
    mockUnitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Once);
}
```

---

## 12. Summary of Issues

| Issue | Severity | Impact | Effort to Fix |
|-------|----------|--------|---------------|
| Infinite recursion in SaveChangesAsync | CRITICAL | App crash | 5 minutes |
| Pattern misidentification (not true UoW) | HIGH | Architectural debt | 2-3 weeks |
| Violation of ISP | MEDIUM | Testing difficulty | 1-2 weeks |
| Inconsistent service layer usage | MEDIUM | Confusion, maintenance | 1 week |
| No transaction management | MEDIUM | Data integrity risk | 2-3 days |
| Missing repository pattern | LOW-MEDIUM | Testability, query optimization | 2-3 weeks |
| No query optimization strategy | LOW | Performance | 1 week |
| GDPR enforcement not centralized | MEDIUM | Compliance risk | 3-5 days |

---

## 13. Recommendations

### Immediate Actions (This Week):
1. **Fix the SaveChangesAsync bug** - this is a production-ready bug waiting to happen
2. **Add CancellationToken support** to all async methods
3. **Standardize on one pattern** - either all services use IUnitOfWork OR all use RentManagerDbContext (currently inconsistent)

### Short-term (Next Sprint):
1. **Add explicit transaction support** to IUnitOfWork interface
2. **Implement transaction handling** in critical operations (payments, GDPR deletions)
3. **Add EF Core interceptors** for legal hold enforcement

### Medium-term (Next Quarter):
1. **Introduce Repository Pattern** incrementally
2. **Refactor complex services** to use repositories
3. **Implement Specification Pattern** for query optimization
4. **Add comprehensive unit tests** using mocked repositories

### Long-term (Strategic):
1. **Full migration to Repository + UoW pattern**
2. **CQRS consideration** for read-heavy operations (reporting, dashboards)
3. **Consider MediatR** for better separation of concerns
4. **Event sourcing** for audit trail (GDPR requirement)

---

## 14. Architectural Decision Record (ADR)

### Decision: Refactor to Repository + Unit of Work Pattern

**Context:**
The current IUnitOfWork implementation is a misnamed DbContext abstraction that violates SOLID principles and creates testing difficulties.

**Decision:**
Migrate to a proper Repository + Unit of Work pattern over the next 2-3 sprints.

**Consequences:**

**Positive:**
- Improved testability through interface-based repositories
- Better separation of concerns (data access vs business logic)
- Centralized query optimization
- GDPR compliance through interceptors
- Transaction management capabilities
- Easier to swap data access technologies in future

**Negative:**
- Upfront development effort (2-3 weeks)
- Learning curve for team members unfamiliar with pattern
- More code to maintain (repository classes)
- Potential over-engineering for simple CRUD operations

**Mitigation:**
- Implement incrementally (start with complex aggregates)
- Provide team training on pattern
- Create code generators for repository boilerplate
- Use generic repositories for simple entities

---

## 15. References and Further Reading

1. **Martin Fowler - Unit of Work Pattern**
   https://martinfowler.com/eaaCatalog/unitOfWork.html

2. **Microsoft Docs - Repository Pattern with EF Core**
   https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design

3. **EF Core Best Practices**
   https://docs.microsoft.com/en-us/ef/core/performance/

4. **SOLID Principles in C#**
   https://docs.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/architectural-principles

5. **Specification Pattern**
   https://enterprisecraftsmanship.com/posts/specification-pattern-c-implementation/

---

## Appendix A: Complete Repository Implementation Example

```csharp
// File: /backend/RentManager.API/Data/Repositories/IRepository.cs
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(string id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T> AddAsync(T entity);
    Task AddRangeAsync(IEnumerable<T> entities);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
    Task DeleteRangeAsync(IEnumerable<T> entities);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);
}

// File: /backend/RentManager.API/Data/Repositories/Repository.cs
public class Repository<T> : IRepository<T> where T : class
{
    protected readonly RentManagerDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(RentManagerDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(string id)
    {
        return await _dbSet.FindAsync(id);
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        return entity;
    }

    public virtual async Task AddRangeAsync(IEnumerable<T> entities)
    {
        await _dbSet.AddRangeAsync(entities);
    }

    public virtual Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        return Task.CompletedTask;
    }

    public virtual Task DeleteAsync(T entity)
    {
        _dbSet.Remove(entity);
        return Task.CompletedTask;
    }

    public virtual Task DeleteRangeAsync(IEnumerable<T> entities)
    {
        _dbSet.RemoveRange(entities);
        return Task.CompletedTask;
    }

    public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
    {
        return predicate == null
            ? await _dbSet.CountAsync()
            : await _dbSet.CountAsync(predicate);
    }

    public virtual async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.AnyAsync(predicate);
    }
}

// File: /backend/RentManager.API/Data/Repositories/IUserRepository.cs
public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdWithRolesAsync(string id);
    Task<User?> GetByIdWithPersonAsync(string id);
    Task<List<User>> GetInactiveUsersAsync(int monthsInactive);
    Task<bool> EmailExistsAsync(string email);
}

// File: /backend/RentManager.API/Data/Repositories/UserRepository.cs
public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(RentManagerDbContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet
            .Include(u => u.Person)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> GetByIdWithRolesAsync(string id)
    {
        return await _dbSet
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByIdWithPersonAsync(string id)
    {
        return await _dbSet
            .Include(u => u.Person)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<List<User>> GetInactiveUsersAsync(int monthsInactive)
    {
        var cutoffDate = DateTimeOffset.UtcNow.AddMonths(-monthsInactive);
        return await _dbSet
            .Where(u => u.UpdatedAt < cutoffDate && !u.IsActive)
            .ToListAsync();
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _dbSet.AnyAsync(u => u.Email == email);
    }
}

// File: /backend/RentManager.API/Data/UnitOfWork.cs
public class UnitOfWork : IUnitOfWork
{
    private readonly RentManagerDbContext _context;
    private IUserRepository? _users;
    private IRepository<Property>? _properties;
    private IRepository<Payment>? _payments;
    private IRepository<DataRetentionSchedule>? _retentionSchedules;
    private IRepository<LegalHold>? _legalHolds;

    public UnitOfWork(RentManagerDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users =>
        _users ??= new UserRepository(_context);

    public IRepository<Property> Properties =>
        _properties ??= new Repository<Property>(_context);

    public IRepository<Payment> Payments =>
        _payments ??= new Repository<Payment>(_context);

    public IRepository<DataRetentionSchedule> RetentionSchedules =>
        _retentionSchedules ??= new Repository<DataRetentionSchedule>(_context);

    public IRepository<LegalHold> LegalHolds =>
        _legalHolds ??= new Repository<LegalHold>(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IDbContextTransaction> BeginTransactionAsync()
    {
        return await _context.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        if (_context.Database.CurrentTransaction != null)
        {
            await _context.Database.CurrentTransaction.CommitAsync();
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_context.Database.CurrentTransaction != null)
        {
            await _context.Database.CurrentTransaction.RollbackAsync();
        }
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
```

---

## Contact Information

For questions about this review or implementation guidance, contact:

- **Architecture Team**: architecture@rentmanager.example.com
- **Technical Lead**: tech-lead@rentmanager.example.com

**Document Version:** 1.0
**Last Updated:** 2025-11-17
