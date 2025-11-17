# Cookie Policy - Quick Start Guide

## For Developers: 5-Minute Setup

### Prerequisites
- Backend: ASP.NET Core 9.0
- Frontend: React 18+
- Database: PostgreSQL

---

## Step 1: Apply Database Migration (30 seconds)

```bash
cd backend/RentManager.API
dotnet ef database update
```

**Verify:**
```bash
dotnet ef migrations list
# Should show: "AddCookieConsent" as applied
```

---

## Step 2: Test Backend API (1 minute)

```bash
# Start backend
cd backend/RentManager.API
dotnet run

# In another terminal, test the API
curl http://localhost:5001/api/CookieConsent/policy
```

**Expected Response:**
```json
{
  "version": "1.0",
  "lastUpdated": "2025-11-13",
  "categories": [...]
}
```

---

## Step 3: Test Frontend (1 minute)

```bash
cd frontend
npm start
```

**What to check:**
1. Clear browser cookies and localStorage
2. Open http://localhost:3000
3. Cookie banner should appear after 1 second
4. Click "Accept All" - banner disappears
5. Reload page - banner should NOT reappear
6. Navigate to `/cookie-policy` - page should load

---

## Step 4: Verify Cookie Consent Works (2 minutes)

### Test Flow 1: Accept All
1. Clear cookies/localStorage
2. Visit application
3. Click "Accept All"
4. Check localStorage: `cookieConsent` should have all true
5. Check browser console: No errors

### Test Flow 2: Necessary Only
1. Clear cookies/localStorage
2. Visit application
3. Click "Accept Necessary Only"
4. Check localStorage: functional/performance/marketing should be false
5. Theme preference should reset on reload

### Test Flow 3: Customize
1. Clear cookies/localStorage
2. Visit application
3. Click "Customize"
4. Enable only "Functional"
5. Save
6. Verify preferences persist

---

## Common Issues & Solutions

### Issue: Cookie banner doesn't appear
**Solution:**
```javascript
// Check browser console
// Open DevTools > Application > Local Storage
// Look for: cookieConsentToken and cookieConsent
// Delete both and reload
```

### Issue: API returns 404
**Solution:**
```bash
# Verify controller is registered
cd backend/RentManager.API
dotnet build
# Check for compilation errors

# Verify endpoint exists
curl http://localhost:5001/swagger
# Should show CookieConsent endpoints
```

### Issue: CORS error
**Solution:**
```json
// Check appsettings.json
{
  "FrontendUrl": "http://localhost:3000"
}
```

### Issue: Migration fails
**Solution:**
```bash
# Check connection string
cd backend/RentManager.API
# Verify appsettings.json has correct PostgreSQL connection

# Try manually
dotnet ef migrations add AddCookieConsent --force
dotnet ef database update
```

---

## Key Files Reference

### Backend
```
Models/CookieConsent.cs              - Database model
DTOs/CookieConsentDto.cs             - API contracts
Controllers/CookieConsentController.cs - API endpoints
Data/RentManagerDbContext.cs         - EF Core configuration
```

### Frontend
```
services/cookieConsentService.js              - Business logic
components/CookieConsent/CookieBanner.jsx     - First-time banner
components/CookieConsent/CookiePreferences.jsx - Settings modal
pages/CookiePolicy/CookiePolicy.jsx           - Policy page
App.js                                        - Integration point
```

---

## Quick Configuration

### Environment Variables

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5001
REACT_APP_ZITADEL_AUTHORITY=your-zitadel-instance
REACT_APP_ZITADEL_CLIENT_ID=your-client-id
```

**Backend (appsettings.json):**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=rentmanager;Username=postgres;Password=yourpassword"
  },
  "FrontendUrl": "http://localhost:3000",
  "Zitadel": {
    "Authority": "https://your-instance.zitadel.cloud",
    "Audience": "your-client-id@your-project"
  }
}
```

---

## Testing Checklist

### Manual Testing
- [ ] Cookie banner appears on first visit
- [ ] "Accept All" saves preferences
- [ ] "Necessary Only" works
- [ ] "Customize" opens modal
- [ ] Preferences persist after reload
- [ ] Cookie Policy page loads
- [ ] "Manage Preferences" button works
- [ ] Authenticated user: preferences saved to database
- [ ] Anonymous user: preferences use token

### API Testing
```bash
# Get policy (public)
curl http://localhost:5001/api/CookieConsent/policy

# Save consent (anonymous)
curl -X POST http://localhost:5001/api/CookieConsent \
  -H "Content-Type: application/json" \
  -d '{"functional":true,"performance":false,"marketing":false,"consentToken":"test-token"}'

# Get consent (authenticated - requires JWT)
curl http://localhost:5001/api/CookieConsent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      User Browser                        │
│  ┌────────────────────────────────────────────────┐    │
│  │  React App (Port 3000)                         │    │
│  │  - CookieBanner component                      │    │
│  │  - CookiePreferences modal                     │    │
│  │  - cookieConsentService                        │    │
│  └────────────────┬───────────────────────────────┘    │
└───────────────────┼──────────────────────────────────────┘
                    │
                    │ HTTP/HTTPS (CORS enabled)
                    │
         ┌──────────▼─────────────┐
         │   ASP.NET Core API     │
         │   (Port 5001/5000)     │
         │                        │
         │  CookieConsentController
         │  ├─ GET /policy       │ (Public)
         │  ├─ GET /             │ (Auth optional)
         │  ├─ POST /            │ (Auth optional)
         │  └─ POST /withdraw    │ (Auth optional)
         └────────────┬───────────┘
                      │
                      │ Entity Framework Core
                      │
              ┌───────▼────────┐
              │   PostgreSQL   │
              │                │
              │ cookie_consents│
              │   - id         │
              │   - user_id    │
              │   - token      │
              │   - preferences│
              │   - timestamps │
              └────────────────┘
```

---

## Security Quick Check

### ✅ Verify These Security Features

1. **HTTPS in Production**
   ```csharp
   // Program.cs
   if (!app.Environment.IsDevelopment())
   {
       app.UseHttpsRedirection();
   }
   ```

2. **CORS Configured**
   ```csharp
   app.UseCors("AllowFrontend");
   ```

3. **JWT Validation**
   ```csharp
   builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
   ```

4. **SQL Injection Protected**
   - ✅ Using EF Core with parameterized queries

5. **XSS Protected**
   - ✅ React escapes by default
   - ✅ No dangerouslySetInnerHTML used

---

## Performance Optimization

### Caching Strategy

```javascript
// Frontend: Cache consent for 1 hour
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

class CookieConsentService {
  getCachedConsent() {
    const cached = localStorage.getItem('cookieConsent');
    if (!cached) return null;

    const consent = JSON.parse(cached);
    const age = Date.now() - new Date(consent.consentDate).getTime();

    return age < CACHE_DURATION ? consent : null;
  }
}
```

```csharp
// Backend: Add response caching for policy endpoint
[HttpGet("policy")]
[AllowAnonymous]
[ResponseCache(Duration = 3600)] // 1 hour
public ActionResult<object> GetCookiePolicy()
{
    // ...
}
```

---

## Monitoring & Logging

### Key Metrics to Track

```sql
-- Consent acceptance rate
SELECT
    COUNT(CASE WHEN functional THEN 1 END)::float / COUNT(*) * 100 as functional_acceptance_rate,
    COUNT(CASE WHEN performance THEN 1 END)::float / COUNT(*) * 100 as performance_acceptance_rate,
    COUNT(CASE WHEN marketing THEN 1 END)::float / COUNT(*) * 100 as marketing_acceptance_rate
FROM cookie_consents
WHERE consent_date > NOW() - INTERVAL '30 days';

-- Expired consents needing renewal
SELECT COUNT(*)
FROM cookie_consents
WHERE expiry_date < NOW();

-- Recent consent changes
SELECT
    consent_date,
    functional,
    performance,
    marketing
FROM cookie_consents
ORDER BY consent_date DESC
LIMIT 100;
```

### Backend Logging

```csharp
// Add to CookieConsentController
_logger.LogInformation(
    "Cookie consent saved - Functional: {Functional}, Performance: {Performance}, Marketing: {Marketing}",
    request.Functional, request.Performance, request.Marketing
);
```

---

## Deployment Checklist

### Before Production Deploy

- [ ] Environment variables configured
- [ ] Database connection string secure (not in source control)
- [ ] HTTPS enabled and enforced
- [ ] CORS configured with production domain
- [ ] Cookie policy text reviewed by legal team
- [ ] Privacy policy link working
- [ ] All third-party DPAs in place (Zitadel, Stripe)
- [ ] Security headers configured (see COOKIE_SECURITY_COMPLIANCE.md)
- [ ] Rate limiting enabled
- [ ] Logging and monitoring configured
- [ ] Backup strategy in place
- [ ] Incident response plan documented

### After Production Deploy

- [ ] Test cookie banner appears
- [ ] Test all consent flows
- [ ] Verify API endpoints work
- [ ] Check browser console for errors
- [ ] Verify HTTPS certificate
- [ ] Test from different browsers
- [ ] Test from mobile devices
- [ ] Monitor error logs for 24 hours
- [ ] Verify database writes working

---

## Support & Troubleshooting

### Debug Mode

```javascript
// Frontend: Enable debug logging
class CookieConsentService {
  constructor() {
    this.debug = process.env.NODE_ENV === 'development';
  }

  log(...args) {
    if (this.debug) console.log('[CookieConsent]', ...args);
  }
}
```

```csharp
// Backend: Enable detailed logging
"Logging": {
  "LogLevel": {
    "RentManager.API.Controllers.CookieConsentController": "Debug"
  }
}
```

### Common Commands

```bash
# Clear all consent data (testing)
# Browser console:
localStorage.removeItem('cookieConsentToken');
localStorage.removeItem('cookieConsent');
localStorage.removeItem('activeRole');
localStorage.removeItem('rentManager_theme');

# View current consent
console.log(JSON.parse(localStorage.getItem('cookieConsent')));

# Database: View all consents
psql -d rentmanager -c "SELECT * FROM cookie_consents ORDER BY consent_date DESC LIMIT 10;"

# Database: Clear test data
psql -d rentmanager -c "DELETE FROM cookie_consents WHERE consent_token LIKE 'test-%';"
```

---

## Next Steps

1. **Review Full Documentation**
   - Read: `COOKIE_POLICY_IMPLEMENTATION.md`
   - Read: `COOKIE_SECURITY_COMPLIANCE.md`

2. **Customize for Your Needs**
   - Update contact email addresses in Cookie Policy
   - Adjust cookie banner styling to match brand
   - Add company-specific legal language

3. **Production Hardening**
   - Implement security headers
   - Add rate limiting
   - Configure monitoring

4. **Legal Review**
   - Have legal team review Cookie Policy text
   - Verify compliance with local regulations
   - Ensure DPAs are in place

---

## Resources

- **GDPR Info:** https://gdpr-info.eu/
- **ICO Cookie Guidance:** https://ico.org.uk/for-organisations/guide-to-pecr/cookies-and-similar-technologies/
- **EDPB Guidelines:** https://edpb.europa.eu/
- **React Documentation:** https://react.dev/
- **ASP.NET Core Security:** https://learn.microsoft.com/en-us/aspnet/core/security/

---

**Version:** 1.0
**Last Updated:** 2025-11-13
**Maintainer:** Security & Compliance Team
