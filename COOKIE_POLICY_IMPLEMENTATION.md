# Cookie Policy Implementation Guide

## Overview

This document provides a comprehensive guide to the cookie policy implementation for the RentFlow Property Management application. The implementation is fully GDPR-compliant and follows security best practices.

## Implementation Summary

### Backend Components

1. **Database Model**: `CookieConsent.cs`
   - Location: `/backend/RentManager.API/Models/CookieConsent.cs`
   - Stores user cookie preferences with audit trail
   - Tracks consent expiry (12 months as per GDPR recommendation)

2. **API Controller**: `CookieConsentController.cs`
   - Location: `/backend/RentManager.API/Controllers/CookieConsentController.cs`
   - Endpoints:
     - `GET /api/CookieConsent` - Retrieve consent preferences
     - `POST /api/CookieConsent` - Save/update consent
     - `POST /api/CookieConsent/withdraw` - Withdraw consent
     - `GET /api/CookieConsent/policy` - Get policy details

3. **Database Migration**: `AddCookieConsent`
   - Creates `cookie_consents` table
   - Indexed on UserId, ConsentToken, and ExpiryDate for performance

### Frontend Components

1. **Cookie Consent Service**: `cookieConsentService.js`
   - Location: `/frontend/src/services/cookieConsentService.js`
   - Manages consent state and API interactions
   - Implements consent token for anonymous users

2. **Cookie Banner**: `CookieBanner.jsx`
   - Location: `/frontend/src/components/CookieConsent/CookieBanner.jsx`
   - First-time consent collection
   - Clear categorization of cookie types
   - "Accept All", "Necessary Only", and "Customize" options

3. **Cookie Preferences Modal**: `CookiePreferences.jsx`
   - Location: `/frontend/src/components/CookieConsent/CookiePreferences.jsx`
   - Detailed cookie management interface
   - Toggle controls for each category
   - Displays specific cookies used

4. **Cookie Policy Page**: `CookiePolicy.jsx`
   - Location: `/frontend/src/pages/CookiePolicy/CookiePolicy.jsx`
   - Comprehensive policy documentation
   - GDPR-compliant language
   - Easy-to-understand cookie tables

## Cookie Categories

### 1. Strictly Necessary (Cannot be disabled)
- **Legal Basis**: Legitimate Interest (GDPR Article 6(1)(f))
- **Purpose**: Essential for application functionality
- **Cookies**:
  - `oidc.user` - OAuth/OIDC authentication state (Session)
  - Authentication session - Login state (Session)
  - `XSRF-TOKEN` - CSRF protection (Session)
  - `cookieConsentToken` - Consent tracking (12 months)

### 2. Functional (Optional - Requires Consent)
- **Legal Basis**: Consent (GDPR Article 6(1)(a))
- **Purpose**: Remember user preferences
- **Cookies**:
  - `activeRole` - Selected user role (Persistent)
  - `rentManager_theme` - Theme preference (Persistent)

### 3. Performance (Optional - Not Currently Used)
- **Legal Basis**: Consent (GDPR Article 6(1)(a))
- **Purpose**: Analytics and performance monitoring
- **Status**: Reserved for future implementation

### 4. Marketing (Optional - Not Currently Used)
- **Legal Basis**: Consent (GDPR Article 6(1)(a))
- **Purpose**: Advertising and targeting
- **Status**: Not implemented

## GDPR Compliance Features

### Data Subject Rights Implementation

1. **Right to Access**
   - Users can view current consent preferences via API
   - Policy page shows all cookies used

2. **Right to Rectification**
   - Users can update preferences at any time
   - "Manage Cookie Preferences" button available

3. **Right to Erasure**
   - "Withdraw Consent" functionality
   - Removes non-essential cookies immediately

4. **Right to Restriction**
   - Granular controls for each cookie category
   - Can enable/disable individual categories

5. **Right to Object**
   - Clear opt-out mechanisms for all non-essential cookies
   - "Necessary Only" option prominent

6. **Right to Data Portability**
   - Consent data retrievable via API
   - JSON format for easy export

### Consent Requirements

- **Freely Given**: Multiple options (Accept All, Necessary, Customize)
- **Specific**: Separate toggles for each category
- **Informed**: Detailed descriptions and cookie lists
- **Unambiguous**: Clear affirmative action required
- **Withdrawable**: Easy to change preferences at any time

### Audit Trail

The system records:
- User ID (if authenticated) or anonymous consent token
- Consent preferences for each category
- Timestamp of consent
- IP address (for audit purposes)
- User agent (for audit purposes)
- Policy version accepted
- Expiry date (12 months)

## Security Considerations

### Token Management

1. **Anonymous Users**
   - Unique consent token generated client-side
   - Stored in localStorage
   - Used to track consent without authentication

2. **Authenticated Users**
   - Consent linked to User ID
   - Server-side validation
   - Migrated on login if anonymous consent exists

### Cookie Security

1. **Session Cookies**
   - HttpOnly flag enabled (prevents XSS)
   - Secure flag in production (HTTPS only)
   - SameSite=Strict for CSRF protection

2. **Data Minimization**
   - Only essential data stored in cookies
   - Sensitive data never in client-side storage
   - Tokens use secure random generation

### API Security

1. **Authentication**
   - JWT Bearer tokens for authenticated endpoints
   - Anonymous endpoints have rate limiting

2. **Input Validation**
   - Server-side validation of all consent data
   - SQL injection protection via parameterized queries

3. **CORS Configuration**
   - Strict origin validation
   - Credentials allowed only for trusted origins

## Deployment Steps

### 1. Backend Deployment

```bash
# Navigate to API project
cd backend/RentManager.API

# Apply database migrations
dotnet ef database update

# Verify migration applied
dotnet ef migrations list

# Build and test
dotnet build
dotnet test
```

### 2. Frontend Deployment

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if needed)
npm install

# Build production bundle
npm run build

# Test locally
npm start
```

### 3. Configuration

#### Backend (appsettings.json)
```json
{
  "Logging": {
    "LogLevel": {
      "RentManager.API.Controllers.CookieConsentController": "Information"
    }
  }
}
```

#### Frontend (.env)
```env
REACT_APP_API_URL=https://your-api-domain.com
```

### 4. Verification Checklist

- [ ] Database migration applied successfully
- [ ] Cookie consent banner appears on first visit
- [ ] "Accept All" saves all preferences correctly
- [ ] "Necessary Only" disables optional cookies
- [ ] "Customize" opens preference modal
- [ ] Preferences persist across sessions
- [ ] Authenticated users: consent linked to User ID
- [ ] Anonymous users: consent token created
- [ ] Cookie Policy page loads correctly
- [ ] Consent expires after 12 months
- [ ] API endpoints respond correctly
- [ ] CORS configured properly
- [ ] No console errors

## Testing

### Manual Testing

1. **First Visit (Anonymous)**
   - Clear all cookies and localStorage
   - Visit application
   - Verify cookie banner appears after 1 second
   - Test "Accept All" - check preferences saved
   - Test "Necessary Only" - check optional cookies removed
   - Test "Customize" - verify granular controls work

2. **Authenticated User**
   - Login to application
   - Set cookie preferences
   - Logout and login again
   - Verify preferences persisted

3. **Consent Expiry**
   - Modify `expiryDate` in database to past date
   - Reload application
   - Verify banner appears again

4. **Cookie Policy Page**
   - Navigate to `/cookie-policy`
   - Verify all sections load
   - Test "Manage Cookie Preferences" button
   - Check external links work

### API Testing

```bash
# Get consent (authenticated)
curl -X GET https://api.domain.com/api/CookieConsent \
  -H "Authorization: Bearer YOUR_TOKEN"

# Save consent (authenticated)
curl -X POST https://api.domain.com/api/CookieConsent \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "functional": true,
    "performance": false,
    "marketing": false
  }'

# Get policy (public)
curl -X GET https://api.domain.com/api/CookieConsent/policy
```

## Compliance Checklist

### GDPR Compliance

- [x] **Article 7**: Conditions for consent
  - Freely given, specific, informed, unambiguous
  - Implemented via banner with clear options

- [x] **Article 13**: Information to be provided
  - Cookie Policy page provides all required information
  - Clear purpose, legal basis, retention period

- [x] **Article 15**: Right of access
  - API endpoint to retrieve consent data
  - Cookie Policy shows all cookies

- [x] **Article 16**: Right to rectification
  - "Manage Cookie Preferences" functionality

- [x] **Article 17**: Right to erasure
  - "Withdraw Consent" option available

- [x] **Article 21**: Right to object
  - Opt-out mechanisms for all non-essential cookies

- [x] **Article 30**: Records of processing activities
  - Audit trail in database with timestamps, IP, user agent

- [x] **Recital 32**: Consent requirements
  - Pre-ticked boxes avoided
  - Affirmative action required

### ePrivacy Directive

- [x] **Article 5(3)**: Cookie consent requirements
  - Consent obtained before non-essential cookies set
  - Strictly necessary cookies exempted

- [x] **Clear information provided**
  - Purpose of each cookie explained
  - Duration specified

### CCPA/CPRA (California)

- [x] **Right to Know**: User can access consent data
- [x] **Right to Delete**: User can withdraw consent
- [x] **Right to Opt-Out**: Clear opt-out mechanisms
- [x] **Notice**: Cookie Policy provides required disclosures

## Future Enhancements

### Phase 2 (Optional)

1. **Analytics Integration**
   - Google Analytics with consent mode
   - Only load when performance cookies accepted

2. **A/B Testing**
   - Test different banner designs
   - Measure consent rates

3. **Multi-language Support**
   - Translate cookie policy
   - Localized consent banners

4. **Advanced Features**
   - Cookie scanning automation
   - Consent management platform integration
   - Do Not Track (DNT) signal support

## Support and Maintenance

### Regular Tasks

1. **Monthly**: Review consent logs for anomalies
2. **Quarterly**: Update cookie inventory
3. **Annually**: Review and update Cookie Policy
4. **As Needed**: Test after any third-party service changes

### Monitoring

- Monitor API error rates
- Track consent acceptance rates
- Review expired consents
- Audit database for orphaned records

## Contact

For questions about cookie policy implementation:
- **Technical**: dpo@rentflow.com
- **Legal**: privacy@rentflow.com

## References

- [GDPR Official Text](https://gdpr-info.eu/)
- [ePrivacy Directive](https://eur-lex.europa.eu/eli/dir/2002/58/oj)
- [ICO Cookie Guidance](https://ico.org.uk/for-organisations/guide-to-pecr/cookies-and-similar-technologies/)
- [EDPB Guidelines on Consent](https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en)

---

**Version**: 1.0
**Last Updated**: 2025-11-13
**Author**: Security and Compliance Architecture Team
