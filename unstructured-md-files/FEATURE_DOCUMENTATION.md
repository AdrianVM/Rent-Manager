# Rent Manager - Comprehensive Feature Documentation

**Version:** 1.0
**Last Updated:** October 26, 2025
**Document Type:** Product Feature Specification & Business Analysis

---

## Executive Summary

Rent Manager is a full-stack property management application designed to streamline rental property operations for property owners, managers, and tenants. The platform provides comprehensive tools for managing properties, tenants, lease contracts, and rent payments with an emphasis on the Romanian rental market.

### Technology Stack
- **Backend:** ASP.NET Core (C#) with Entity Framework Core
- **Frontend:** React with modern UI components
- **Database:** PostgreSQL
- **Authentication:** Zitadel (OAuth2/OIDC)
- **Payment Processing:** Stripe integration
- **Architecture:** RESTful API with role-based access control

### Target Users
1. **Property Owners** - Individual landlords managing their rental portfolio
2. **Property Managers/Admins** - Professional property management companies
3. **Tenants/Renters** - Individuals or companies renting properties

---

## Feature Categories Overview

The application is organized into seven major feature categories:

1. Property Management
2. Tenant Management
3. Payment Processing & Collection
4. Contract Management
5. User Management & Authentication
6. Dashboard & Reporting
7. Onboarding & Invitations

---

## 1. Property Management

### 1.1 Property Portfolio Management
**Category:** Property Management
**User Roles:** Admin, PropertyOwner
**Implementation Status:** ✅ Completed

#### Description
Comprehensive property management system allowing owners to catalog and manage their entire rental portfolio with support for multiple property types.

#### Key Functionality
1. **Property Types Supported:**
   - Residential Apartments
   - Houses
   - Condominiums
   - Commercial Spaces
   - Parking Spaces (with detailed parking-specific fields)

2. **Property Information Tracking:**
   - Basic details: Name, address, description
   - Residential properties: Bedrooms, bathrooms counts
   - Commercial properties: Square footage
   - Parking spaces: Parking type (outdoor, covered, garage, underground), space number
   - Monthly rent amount
   - Creation and update timestamps

3. **CRUD Operations:**
   - Create new properties with validation
   - Edit existing property details
   - Delete properties (with safety confirmations)
   - View property list with filtering and sorting

#### Business Value
- Centralized property portfolio management
- Flexible property type handling for diverse real estate portfolios
- Easy tracking of property details and rental rates
- Foundation for tenant assignment and payment tracking

#### Technical Implementation
- **Backend:** `PropertiesController.cs`
- **Frontend:** `/pages/Properties/Properties.js`
- **Models:** `Property.cs` with PropertyType and ParkingType enums
- **Database:** Properties table with user relationship through PropertyOwner junction table

#### User Stories
1. As a property owner, I want to add my rental properties to the system so I can track them centrally.
2. As a property manager, I want to categorize properties by type so I can manage different property portfolios effectively.
3. As an admin, I want to view all properties in the system so I can provide support and oversight.

---

### 1.2 Property-Owner Relationship Management
**Category:** Property Management
**User Roles:** Admin, PropertyOwner
**Implementation Status:** ✅ Completed

#### Description
Many-to-many relationship management allowing multiple owners per property and multiple properties per owner, supporting complex ownership structures.

#### Key Functionality
1. Property ownership tracking through PropertyOwner junction entity
2. Role-based property filtering (users only see their own properties)
3. Ownership validation for property operations

#### Business Value
- Supports complex ownership scenarios (partnerships, multiple owners)
- Ensures data security through ownership verification
- Enables accurate revenue attribution

#### Technical Implementation
- **Models:** `PropertyOwner.cs` junction table
- **Authorization:** User-property relationship validation in all property operations

---

## 2. Tenant Management

### 2.1 Tenant Registry & Profiles
**Category:** Tenant Management
**User Roles:** Admin, PropertyOwner
**Implementation Status:** ✅ Completed

#### Description
Comprehensive tenant management system supporting both individual and corporate tenants with complete profile information.

#### Key Functionality
1. **Tenant Types:**
   - **Person Tenants:** Individual renters with personal information
     - Name (First, Middle, Last)
     - Date of birth
     - ID number
     - Nationality
     - Occupation
     - Emergency contact details (name, phone, relationship)

   - **Company Tenants:** Corporate lessees with business information
     - Company name
     - Tax ID and registration number
     - Legal form and industry
     - Contact person details (name, title, email, phone)
     - Billing address

2. **Lease Information:**
   - Property assignment
   - Lease start and end dates
   - Monthly rent amount
   - Security deposit amount
   - Tenant status (Active, Inactive, Pending)

3. **Contact Information:**
   - Email address
   - Phone number
   - Emergency contact details

4. **Tenant Operations:**
   - Create new tenant profiles
   - Edit existing tenant information
   - Delete tenants
   - Filter by tenant type and status
   - View tenant history and payment records

#### Business Value
- Dual-mode support for residential and commercial leasing
- Complete tenant information for compliance and communication
- Emergency contact tracking for safety and liability
- Flexible tenant status management for lifecycle tracking

#### Technical Implementation
- **Backend:** `TenantsController.cs`, `TenantOnboardingController.cs`
- **Frontend:** `/pages/Tenants/Tenants.js`, tenant form components
- **Models:** `Tenant.cs` with Person/Company discriminator, `Person.cs`, `Company.cs`
- **Database:** Tenant, Person, and Company tables with relationships

#### User Stories
1. As a property manager, I want to maintain complete tenant profiles so I have all necessary contact information.
2. As a property owner, I want to track both individual and company tenants so I can manage residential and commercial properties.
3. As an admin, I want to view tenant status so I can identify active leases and vacancies.

---

### 2.2 Tenant Invitation System
**Category:** Tenant Management / Onboarding
**User Roles:** Admin, PropertyOwner (create), Public (redeem)
**Implementation Status:** ✅ Completed

#### Description
Streamlined tenant invitation workflow allowing property owners to invite prospective tenants via secure, tokenized links with pre-populated lease information.

#### Key Functionality
1. **Invitation Creation:**
   - Property owner selects property
   - Enters tenant email
   - Specifies lease terms (rent amount, deposit, dates)
   - System generates unique invitation token
   - Creates shareable invitation link

2. **Invitation Management:**
   - View all sent invitations
   - Track invitation status (Pending, Accepted, Expired, Cancelled)
   - Resend invitations (generates new token)
   - Cancel pending invitations
   - Automatic expiration (7 days default)

3. **Invitation Statuses:**
   - Pending: Awaiting tenant acceptance
   - Accepted: Tenant completed onboarding
   - Expired: Past expiration date
   - Cancelled: Manually cancelled by owner

#### Business Value
- Streamlines tenant acquisition process
- Reduces manual data entry errors
- Pre-populates lease terms for consistency
- Secure, time-limited access to onboarding
- Eliminates need for separate tenant account creation by staff

#### Technical Implementation
- **Backend:** `TenantInvitationsController.cs`
- **Frontend:** `InviteTenantModal.js`
- **Models:** `TenantInvitation.cs`
- **Storage:** In-memory (note: production should use database persistence)

#### User Stories
1. As a property owner, I want to invite new tenants via email so they can self-register in the system.
2. As a property manager, I want to track invitation status so I know which tenants have completed onboarding.
3. As an admin, I want to resend expired invitations so tenants can complete the process.

---

### 2.3 Tenant Self-Service Onboarding
**Category:** Tenant Management / Onboarding
**User Roles:** Public (with invitation token)
**Implementation Status:** ✅ Completed

#### Description
Multi-step wizard-based onboarding process allowing invited tenants to create their account, provide personal information, and accept lease terms without staff intervention.

#### Key Functionality
1. **5-Step Onboarding Wizard:**
   - **Step 1 - Verify Invitation:** Display property and lease details
   - **Step 2 - Personal Info:** Name, email (pre-filled), phone, password creation
   - **Step 3 - Emergency Contact:** Optional emergency contact information
   - **Step 4 - Additional Info:** Number of occupants, pet information
   - **Step 5 - Review & Submit:** Summary review and terms acceptance

2. **Invitation Validation:**
   - Token verification
   - Expiration checking
   - Email matching validation
   - Duplicate prevention

3. **Account Creation:**
   - Automatic Person entity creation
   - Tenant record generation
   - Property assignment
   - User account setup with Renter role

4. **User Experience:**
   - Progress indicator across steps
   - Form validation at each step
   - Property details preview
   - Lease terms display
   - Terms and conditions acceptance

#### Business Value
- Reduces administrative overhead
- Improves tenant onboarding experience
- Ensures complete tenant information collection
- Eliminates manual account creation
- Provides transparency in lease terms upfront

#### Technical Implementation
- **Backend:** `TenantOnboardingController.cs`
- **Frontend:** `/pages/TenantOnboarding.js`
- **Components:** `WizardStepper.js` for multi-step navigation
- **Flow:** Token validation → Data collection → Account creation → Invitation acceptance

#### User Stories
1. As an invited tenant, I want to complete my onboarding independently so I don't need to schedule meetings with property staff.
2. As a new tenant, I want to see the property and lease details upfront so I can confirm before creating my account.
3. As a tenant, I want to provide emergency contact information so my landlord has it on file.

---

## 3. Payment Processing & Collection

### 3.1 Core Payment Management
**Category:** Payment Processing
**User Roles:** Admin, PropertyOwner (full access), Renter (view own)
**Implementation Status:** ✅ Completed

#### Description
Comprehensive rent payment tracking and management system with support for multiple payment methods and detailed transaction records.

#### Key Functionality
1. **Payment Recording:**
   - Tenant selection
   - Amount specification
   - Date recording
   - Payment method selection (Cash, Check, Bank Transfer, Credit Card, Online, Debit Card, Mobile Pay, Card Online)
   - Status tracking (Completed, Pending, Failed, Cancelled, Processing, Refunded)
   - Notes and additional details

2. **Payment Methods:**
   - Cash payments
   - Check payments
   - Bank transfers (with IBAN support)
   - Credit/debit card payments
   - Online payments
   - Mobile payments
   - Stripe-integrated card payments

3. **Payment Status Lifecycle:**
   - Pending: Payment initiated but not confirmed
   - Processing: Payment being processed by gateway
   - Completed: Payment successfully received
   - Failed: Payment attempt failed
   - Cancelled: Payment cancelled by user or admin
   - Refunded: Payment returned to payer

4. **Payment Operations:**
   - Create manual payment records
   - Edit payment details
   - Delete payment records (admin)
   - Filter by status (all, completed, pending, failed)
   - View payment history by tenant or property

#### Business Value
- Centralized payment tracking across all properties
- Multiple payment method support for tenant convenience
- Complete payment history for accounting
- Real-time payment status monitoring
- Audit trail for financial compliance

#### Technical Implementation
- **Backend:** `PaymentsController.cs`, `PaymentService.cs`
- **Frontend:** `/pages/Payments/Payments.js`
- **Models:** `Payment.cs` with extensive tracking fields
- **Database:** Payments table with tenant relationships

---

### 3.2 Advanced Payment Processing
**Category:** Payment Processing
**User Roles:** Admin, PropertyOwner, Renter
**Implementation Status:** ✅ Completed

#### Description
Automated payment processing workflows with Stripe integration for online card payments and comprehensive payment lifecycle management.

#### Key Functionality
1. **Payment Initiation:**
   - Initiate payment for tenant
   - Automatic payment reference generation (Romanian format)
   - Bank transfer details (IBAN, account holder)
   - Payment intent creation for card payments
   - Idempotency key generation to prevent duplicates

2. **Stripe Integration:**
   - Payment intent creation
   - Client secret generation for frontend
   - Webhook support for payment status updates
   - Processing fee tracking
   - External transaction ID linking

3. **Payment Processing Workflow:**
   - Payment initiation (creates pending payment)
   - Payment processing (updates to processing status)
   - Payment confirmation (marks as completed)
   - Failure handling (captures failure reason)

4. **Payment Lifecycle Operations:**
   - Cancel pending/processing payments
   - Refund completed payments (full or partial)
   - Process external payments (bank transfers)
   - Confirm payments with confirmation codes

#### Business Value
- Seamless online payment experience for tenants
- Reduced manual payment reconciliation
- Automated payment tracking and status updates
- Support for Romanian banking standards (IBAN validation)
- Reduced payment fraud through secure processing

#### Technical Implementation
- **Backend:** `PaymentsController.cs` (processing endpoints), `StripePaymentGateway.cs`
- **Frontend:** `PaymentModal.js` with Stripe Elements integration
- **Models:** Payment tracking fields for external transactions
- **Services:** `IPaymentGateway` interface with Stripe implementation

---

### 3.3 Romanian Market Payment Features
**Category:** Payment Processing
**User Roles:** Admin, PropertyOwner, Renter
**Implementation Status:** ✅ Completed

#### Description
Specialized payment features tailored for the Romanian rental market, including IBAN validation and structured payment references.

#### Key Functionality
1. **Romanian Payment Reference Generation:**
   - Structured format: `{TenantCode}-{YYYYMM}-{PropertyCode}`
   - Unique per tenant per month
   - Easy reconciliation with bank statements

2. **IBAN Validation:**
   - Romanian IBAN format validation (RO + 22 digits)
   - Check digit verification
   - Real-time validation during data entry

3. **Bank Transfer Support:**
   - IBAN storage for tenant bank accounts
   - Account holder name tracking
   - Payment reference for bank transfer instructions
   - Manual reconciliation workflow

4. **Payment Reconciliation:**
   - Match bank transfers by payment reference
   - Reconcile pending payments with received amounts
   - Date and amount verification
   - Automatic status update on successful reconciliation

#### Business Value
- Compliance with Romanian banking standards
- Simplified bank transfer reconciliation
- Reduced payment matching errors
- Automated payment reference generation
- Better audit trail for tax compliance

#### Technical Implementation
- **Backend:** `PaymentService.cs` (Romanian-specific methods)
- **Validation:** IBAN validation logic
- **Reference Generation:** Algorithmic tenant/property code generation

---

### 3.4 Recurring Payment Automation
**Category:** Payment Processing
**User Roles:** Admin, PropertyOwner
**Implementation Status:** ✅ Completed

#### Description
Automated recurring rent payment generation for active tenants, reducing manual payment record creation.

#### Key Functionality
1. **Automated Payment Generation:**
   - Generate monthly rent payments for all active tenants
   - Specify target month (year and month)
   - Automatic payment amount from tenant rent
   - Bulk creation for all eligible tenants

2. **Recurring Payment Tracking:**
   - IsRecurring flag for automated payments
   - RecurringForMonth timestamp tracking
   - Last payment retrieval per tenant
   - Prevention of duplicate recurring payments for same month

3. **Eligibility Criteria:**
   - Tenant status must be Active
   - Tenant must have assigned property
   - Tenant must have defined rent amount
   - Month must not already have recurring payment

#### Business Value
- Eliminates manual monthly payment record creation
- Ensures consistent payment tracking
- Reduces administrative overhead
- Provides clear recurring vs. one-time payment distinction
- Supports automated rent collection reminders

#### Technical Implementation
- **Backend:** `PaymentsController.cs` (recurring endpoint), `PaymentService.cs`
- **Authorization:** Restricted to Admin and PropertyOwner roles
- **Logic:** Automated payment entity creation with IsRecurring flag

---

### 3.5 Payment Analytics & Reporting
**Category:** Payment Processing / Reporting
**User Roles:** Admin, PropertyOwner
**Implementation Status:** ✅ Completed

#### Description
Comprehensive payment analytics and reporting capabilities for financial insights and business intelligence.

#### Key Functionality
1. **Payment Statistics:**
   - Total collected amount (with date range filtering)
   - Payment count by status
   - Average payment amount
   - Payment method distribution
   - Payment status distribution

2. **Collection Metrics:**
   - Monthly collection totals
   - Collection rate calculation
   - Pending payment count
   - Failed payment tracking
   - Overdue payment identification

3. **Payment Method Analysis:**
   - Breakdown by payment method
   - Amount collected per method
   - Method preference trends
   - Online vs. offline payment ratio

4. **Time-Based Reporting:**
   - Date range filtering
   - Monthly collection trends
   - Year-over-year comparisons
   - Seasonal payment patterns

#### Business Value
- Financial performance visibility
- Payment method optimization insights
- Collection efficiency tracking
- Cash flow forecasting support
- Data-driven decision making

#### Technical Implementation
- **Backend:** `PaymentsController.cs` (analytics endpoints)
- **Frontend:** Dashboard statistics displays
- **Calculations:** Aggregation queries with date filtering and role-based scoping

---

## 4. Contract Management

### 4.1 Digital Contract Storage
**Category:** Contract Management
**User Roles:** Admin, PropertyOwner (upload/manage), Renter (view own)
**Implementation Status:** ✅ Completed

#### Description
Digital contract repository for storing, managing, and distributing lease agreements and related documents.

#### Key Functionality
1. **Contract Upload:**
   - File upload support (PDF, DOC, DOCX)
   - Property and tenant association
   - File size limit (10MB)
   - Automatic metadata capture (filename, size, MIME type)
   - Base64 encoding for database storage
   - Contract status setting (Draft, Pending, Signed, Terminated)
   - Optional notes

2. **Contract Metadata:**
   - Property association
   - Tenant association
   - Upload timestamp
   - Signed date (optional)
   - Contract status
   - File information (name, size, type)
   - Administrative notes

3. **Contract Status Workflow:**
   - Draft: Contract being prepared
   - Pending: Awaiting signature
   - Signed: Executed agreement
   - Terminated: Lease ended

4. **Contract Operations:**
   - Upload new contracts
   - Update contract metadata
   - View contract details
   - Download contract files
   - Delete contracts (admin/owner)
   - Filter by property or tenant

5. **Contract Viewing:**
   - In-browser PDF preview
   - Modal-based viewer
   - Download original file
   - Property and tenant context display

#### Business Value
- Centralized contract storage
- Easy access to lease agreements
- Paperless document management
- Version control through upload history
- Secure document storage
- Simplified contract distribution to tenants

#### Technical Implementation
- **Backend:** `ContractsController.cs`
- **Frontend:** `ContractViewer.js`, `ContractUpload` component in Properties page
- **Models:** `Contract.cs` with base64 file storage
- **Database:** Contracts table with property and tenant foreign keys
- **Storage:** Base64-encoded binary storage in database

#### User Stories
1. As a property owner, I want to upload signed lease agreements so I have digital records.
2. As a tenant, I want to view my lease contract online so I can reference it anytime.
3. As a property manager, I want to track contract status so I know which leases need signatures.

---

### 4.2 Contract Access Control
**Category:** Contract Management / Security
**User Roles:** All (with restrictions)
**Implementation Status:** ✅ Completed

#### Description
Role-based access control for contracts ensuring tenants only see their contracts while owners/admins have full access.

#### Key Functionality
1. **Access Rules:**
   - Tenants: View/download only their own contracts
   - Property Owners: View/manage contracts for their properties
   - Admins: Full access to all contracts

2. **Contract Discovery:**
   - Filter by property
   - Filter by tenant
   - Search by contract metadata

3. **Secure Downloads:**
   - Authorization check before download
   - Original filename preservation
   - MIME type preservation for proper rendering

#### Business Value
- Privacy protection for sensitive lease agreements
- Compliance with data protection regulations
- Prevents unauthorized contract access
- Maintains confidentiality between separate tenancies

#### Technical Implementation
- **Authorization:** Role-based filtering in controller endpoints
- **Download Security:** Authorization checks in download endpoint

---

## 5. User Management & Authentication

### 5.1 User Account Management
**Category:** User Management
**User Roles:** Admin (full access), All users (view/edit own profile)
**Implementation Status:** ✅ Completed

#### Description
Comprehensive user account management with support for multiple roles per user and profile management.

#### Key Functionality
1. **User Profile Information:**
   - Personal details (First, Middle, Last name)
   - Email address (unique identifier)
   - Account status (Active/Inactive)
   - Created date
   - Last login timestamp
   - Associated Person entity for extended profile

2. **User Operations:**
   - Create new users (admin only)
   - View all users (admin only)
   - Edit user profiles (admin or self)
   - Delete users (admin only)
   - Update user roles (admin only)
   - Activate/deactivate accounts (admin only)

3. **Self-Service Profile Management:**
   - Users can view their own profile
   - Users can update their personal information
   - Email address changes
   - Name updates

#### Business Value
- Centralized user management
- Self-service capability reduces admin burden
- Account lifecycle management
- User activity tracking
- Audit trail through timestamps

#### Technical Implementation
- **Backend:** `AuthController.cs`, `AuthService.cs`
- **Frontend:** `/pages/UserManagement/UserManagement.js`
- **Models:** `User.cs` with Person navigation property
- **Database:** Users table with many-to-many role relationships

---

### 5.2 Role-Based Access Control (RBAC)
**Category:** User Management / Security
**User Roles:** Admin
**Implementation Status:** ✅ Completed

#### Description
Sophisticated role-based access control system with support for multiple simultaneous roles per user.

#### Key Functionality
1. **System Roles:**
   - **Admin:** Full system access, user management, system configuration
   - **PropertyOwner:** Property and tenant management, payment tracking, contract management
   - **Renter:** View own rental information, make payments, view contracts

2. **Multi-Role Support:**
   - Users can have multiple roles simultaneously
   - Role-specific UI rendering
   - Active role switching in UI
   - Granular permission control per role

3. **Role Management:**
   - Assign roles during user creation
   - Add/remove roles from existing users
   - View user role assignments
   - Role-based navigation and feature access

4. **Authorization Enforcement:**
   - Controller-level role requirements
   - Endpoint-specific role checks
   - Data filtering based on user role
   - UI element visibility control

#### Business Value
- Flexible permission management
- Supports users with multiple responsibilities
- Granular access control
- Scalable permission model
- Enhanced security through principle of least privilege

#### Technical Implementation
- **Backend:** Role attributes on controllers/actions, `UserRole.cs` junction table
- **Frontend:** Role-based rendering in navigation and components
- **Models:** `Role.cs`, `UserRole.cs` many-to-many relationship
- **Authorization:** ASP.NET Core authorization policies with Zitadel claims

---

### 5.3 Authentication System
**Category:** Authentication / Security
**User Roles:** All
**Implementation Status:** ✅ Completed

#### Description
Enterprise-grade authentication using Zitadel OAuth2/OIDC provider with secure token management.

#### Key Functionality
1. **Authentication Flow:**
   - OAuth2/OIDC authentication via Zitadel
   - Authorization code flow with PKCE
   - Secure token storage
   - Automatic token refresh
   - Session management

2. **User Session:**
   - JWT token-based authentication
   - Token expiration handling
   - Automatic re-authentication
   - Secure logout
   - Claims-based identity

3. **Claims Transformation:**
   - Zitadel claims mapping to application roles
   - Custom claims for application-specific data
   - Role claims for authorization
   - User identifier claims (sub, NameIdentifier)

4. **Security Features:**
   - HTTPS enforcement
   - CORS configuration
   - CSRF protection
   - Secure cookie settings
   - Token validation

#### Business Value
- Enterprise-grade security
- Centralized identity management
- Single sign-on capability
- Reduced password management burden
- Compliance with modern authentication standards

#### Technical Implementation
- **Backend:** `ZitadelClaimsTransformation.cs`, JWT bearer authentication
- **Frontend:** `authService.js`, `zitadelAuth.js`
- **Provider:** Zitadel OAuth2/OIDC
- **Flow:** Authorization code with PKCE

---

## 6. Dashboard & Reporting

### 6.1 Admin Dashboard
**Category:** Dashboard / Reporting
**User Roles:** Admin
**Implementation Status:** ✅ Completed

#### Description
System-wide overview dashboard providing administrators with key metrics and system health indicators.

#### Key Functionality
1. **System Metrics:**
   - Total properties in system
   - Total active tenants
   - Monthly revenue across all properties
   - System-wide occupancy rate

2. **High-Level Statistics:**
   - Aggregate data across all users
   - System health indicators
   - Usage statistics
   - Platform-wide trends

3. **Dashboard Layout:**
   - Card-based metric display
   - Color-coded status indicators
   - Responsive grid layout
   - Real-time data updates

#### Business Value
- System health monitoring
- Platform usage insights
- Resource allocation planning
- Performance monitoring
- Quick problem identification

#### Technical Implementation
- **Backend:** `DashboardController.cs`
- **Frontend:** `/pages/AdminDashboard/AdminDashboard.js`
- **Models:** `DashboardStats.cs`
- **Calculations:** Aggregate queries across all system data

---

### 6.2 Property Owner Dashboard
**Category:** Dashboard / Reporting
**User Roles:** PropertyOwner
**Implementation Status:** ✅ Completed

#### Description
Property owner focused dashboard displaying portfolio performance, revenue metrics, and outstanding payments.

#### Key Functionality
1. **Portfolio Metrics:**
   - Total properties owned
   - Active tenant count
   - Vacant units
   - Overdue payment count

2. **Revenue Metrics:**
   - Current month's collected revenue
   - Expected monthly revenue (total rent)
   - Collection rate percentage
   - Revenue variance

3. **Outstanding Rent Tracking:**
   - List of tenants with outstanding payments
   - Amount due per tenant
   - Overdue status indicators
   - Partial payment tracking
   - Property association

4. **Recent Payment Activity:**
   - Latest payment transactions
   - Tenant and property context
   - Payment date and amount
   - Payment status

5. **Getting Started Guide:**
   - Conditional display for new users
   - Step-by-step onboarding checklist
   - Feature discovery prompts

#### Business Value
- Portfolio performance visibility
- Cash flow monitoring
- Delinquency identification
- Collection efficiency tracking
- Revenue forecasting support
- Quick access to critical financial data

#### Technical Implementation
- **Backend:** `DashboardController.cs`
- **Frontend:** `/pages/PropertyOwnerDashboard/PropertyOwnerDashboard.js`
- **Models:** `DashboardStats.cs`, `OutstandingRentItem.cs`, `RecentPayment.cs`
- **Calculations:** User-scoped aggregations and calculations

---

### 6.3 Renter Dashboard
**Category:** Dashboard / Reporting
**User Roles:** Renter
**Implementation Status:** ✅ Completed

#### Description
Tenant-focused dashboard providing comprehensive view of rental information, payment obligations, and property details.

#### Key Functionality
1. **Rental Overview:**
   - Monthly rent amount
   - Total payments made
   - Total amount paid lifetime
   - Lease status (Active/Inactive)

2. **Next Payment Due:**
   - Current month payment status
   - Amount due calculation (rent - payments made)
   - Overdue indicator (if past 5th of month)
   - Partial payment tracking
   - Due date display
   - "Pay Now" quick action

3. **Property Information:**
   - Property name and address
   - Property type and details (bed/bath, square footage, parking info)
   - Property description
   - Context-aware detail rendering per property type

4. **Lease Information:**
   - Monthly rent amount
   - Security deposit
   - Lease start and end dates
   - Days until lease expiry
   - Expiry warning (when < 30 days)

5. **Payment History:**
   - Last 10 payments
   - Payment date, amount, method
   - Payment status badges
   - Chronological ordering (newest first)

6. **Contract Access:**
   - List of all tenant contracts
   - Contract status (Draft, Pending, Signed, Terminated)
   - Upload and signed dates
   - In-browser contract viewer
   - Download contracts
   - Contract notes display

7. **Maintenance Requests:** (Mock data - not fully implemented)
   - View maintenance requests
   - Request status and priority
   - Submit new requests

8. **Important Notices:** (Mock data - not fully implemented)
   - Building announcements
   - Policy updates
   - Upcoming events

9. **Contact Information:** (Mock data - not fully implemented)
   - Property manager details
   - Emergency maintenance contacts
   - Accounting department info
   - Contact hours

#### Business Value
- Tenant self-service portal
- Reduces support inquiries
- Payment obligation transparency
- Easy access to important rental documents
- Improved tenant communication
- Enhanced tenant experience

#### Technical Implementation
- **Frontend:** `/pages/RenterDashboard/RenterDashboard.js`
- **Components:** Modular dashboard sections (PropertyInfo, LeaseInfo, NextPaymentDue, etc.)
- **Data:** Real-time tenant, property, payment, and contract data
- **Integration:** Payment modal for quick payments

---

## 7. System Configuration

### 7.1 System Settings
**Category:** System Configuration
**User Roles:** Admin
**Implementation Status:** 🔶 Partial

#### Description
Administrative system configuration interface for platform-wide settings.

#### Key Functionality
1. **Settings Categories:** (Planned)
   - Platform configuration
   - Payment gateway settings
   - Email notification settings
   - System defaults
   - Feature flags

2. **Current Implementation:**
   - Settings page placeholder
   - Reserved for future configuration options

#### Business Value
- Centralized configuration management
- System customization capabilities
- Feature toggle control
- Integration settings management

#### Technical Implementation
- **Frontend:** `/pages/SystemSettings/SystemSettings.js`
- **Status:** UI placeholder created, backend implementation pending

---

### 7.2 Demo Data Seeding
**Category:** Development / Testing
**User Roles:** Developer/Admin
**Implementation Status:** ✅ Completed

#### Description
Development tool for populating the system with realistic demo data for testing and demonstration purposes.

#### Key Functionality
1. **Data Seeding:**
   - Create sample properties
   - Generate demo tenants
   - Create payment records
   - Upload sample contracts
   - Generate demo users

2. **Seed Control:**
   - Manual trigger via UI component
   - Backend seed endpoint
   - Configurable seed data sets

#### Business Value
- Rapid testing environment setup
- Realistic demonstrations
- Training data generation
- QA environment preparation

#### Technical Implementation
- **Backend:** `SeedController.cs`, `SeedDataService.cs`
- **Frontend:** `DemoDataSeeder.js` component
- **Usage:** Development and testing only

---

## Cross-Cutting Features

### 8.1 Responsive Design
**Category:** User Experience
**User Roles:** All
**Implementation Status:** ✅ Completed

#### Description
Fully responsive user interface optimized for desktop, tablet, and mobile devices.

#### Key Functionality
1. **Responsive Components:**
   - Adaptive table to card layout on mobile
   - Collapsible navigation on small screens
   - Touch-optimized buttons and controls
   - Flexible grid layouts

2. **Mobile Optimizations:**
   - Mobile-specific action buttons
   - Condensed data views
   - Swipe gestures support
   - Optimized modal dialogs

#### Technical Implementation
- **Components:** `ResponsiveTable.js`, responsive CSS
- **Approach:** Mobile-first CSS with breakpoints

---

### 8.2 Theme Support
**Category:** User Experience
**User Roles:** All
**Implementation Status:** ✅ Completed

#### Description
Light/dark theme support with persistent user preference.

#### Key Functionality
1. **Theme Toggle:**
   - Light theme (default)
   - Dark theme
   - Theme persistence in local storage
   - Instant theme switching

2. **Theme Context:**
   - Global theme state management
   - CSS variable-based theming
   - Consistent styling across all pages

#### Technical Implementation
- **Frontend:** `ThemeContext.js`, CSS custom properties
- **Storage:** localStorage for persistence

---

### 8.3 Data Filtering & Search
**Category:** User Experience
**User Roles:** All
**Implementation Status:** ✅ Completed

#### Description
Filtering and search capabilities across entity lists.

#### Key Functionality
1. **Payment Filtering:**
   - Filter by status (all, completed, pending, failed)
   - Date range filtering (in analytics)

2. **Tenant Filtering:**
   - Filter by tenant type (Person/Company)
   - Filter by status (Active/Inactive/Pending)

3. **Table Features:**
   - Sortable columns
   - Inline search
   - Pagination support (via ResponsiveTable)

#### Technical Implementation
- **Frontend:** Component-level filtering logic
- **Backend:** Query parameter support in controllers

---

## Technical Architecture Details

### Database Schema Highlights
1. **Entity Relationships:**
   - User → UserRole ← Role (many-to-many)
   - User → PropertyOwner ← Property (many-to-many)
   - Property → Tenant (one-to-many)
   - Tenant → Person OR Company (discriminated union)
   - Tenant → Payment (one-to-many)
   - Property + Tenant → Contract (many-to-many junction)

2. **Temporal Data:**
   - All entities have CreatedAt/UpdatedAt timestamps
   - DateTimeOffset used for timezone awareness
   - Recent migration converted DateTime → DateTimeOffset

### API Architecture
1. **RESTful Endpoints:**
   - Standard CRUD operations
   - Resource-oriented URLs
   - HTTP verb-based operations
   - Consistent response formats

2. **Authorization:**
   - JWT bearer tokens
   - Role-based endpoint protection
   - User-scoped data filtering
   - Claims-based identity

3. **Data Transfer:**
   - DTO pattern for API contracts
   - Request/Response models separate from domain
   - Mapper classes for transformations

### Frontend Architecture
1. **Component Structure:**
   - Page-level components
   - Reusable common components
   - Feature-specific components
   - Layout components (Sidebar, Navigation, Footer)

2. **State Management:**
   - Component-level state (useState)
   - Context for global state (ThemeContext)
   - Local storage for persistence
   - API service layer abstraction

3. **Routing:**
   - React Router for SPA navigation
   - Protected routes with authentication
   - Role-based route rendering
   - Public onboarding routes

---

## Feature Implementation Status Summary

### ✅ Fully Completed Features
1. Property Management (CRUD + multi-type support)
2. Tenant Management (Person/Company tenants)
3. Tenant Invitations & Onboarding
4. Payment Management (CRUD + filtering)
5. Payment Processing (Stripe integration)
6. Romanian Payment Features (IBAN, references)
7. Recurring Payment Generation
8. Payment Analytics
9. Contract Management (Upload, view, download)
10. User Management (CRUD + profiles)
11. Role-Based Access Control (multi-role)
12. Authentication (Zitadel OAuth2/OIDC)
13. Admin Dashboard
14. Property Owner Dashboard
15. Renter Dashboard
16. Responsive Design
17. Theme Support

### 🔶 Partially Implemented Features
1. **System Settings:** UI placeholder exists, backend configuration needed
2. **Maintenance Requests:** Mock data in Renter Dashboard, no backend
3. **Notices/Announcements:** Mock data in Renter Dashboard, no backend
4. **Contact Management:** Mock data in Renter Dashboard, needs backend

### ❌ Not Yet Implemented Features
1. **Email Notifications:** For invitations, payment reminders, etc.
2. **Document Generation:** Automated contract/invoice generation
3. **Advanced Reporting:** PDF reports, financial statements
4. **Lease Renewal Workflows:** Automated renewal notices and processes
5. **Multi-Currency Support:** Currently assumes single currency
6. **Bulk Operations:** Bulk payment imports, bulk tenant updates
7. **Advanced Search:** Full-text search across entities
8. **Mobile Apps:** Native iOS/Android applications
9. **API Documentation:** Swagger/OpenAPI documentation
10. **Webhook Management:** For third-party integrations

---

## Identified Gaps & Recommendations

### Critical Gaps
1. **Email Integration:** Tenant invitations should send emails, not just generate links
2. **Invitation Persistence:** Invitations stored in-memory (lost on restart) - need database persistence
3. **Payment Reminders:** No automated reminders for overdue payments
4. **Audit Logging:** Limited audit trail for sensitive operations
5. **File Upload Size:** 10MB contract limit may be restrictive for large documents

### Security Recommendations
1. Implement rate limiting on authentication endpoints
2. Add file upload virus scanning
3. Enhance CORS configuration for production
4. Implement API versioning
5. Add comprehensive input validation and sanitization
6. Implement database encryption for sensitive fields (IBAN, account numbers)

### UX Improvements
1. Add bulk selection/actions for payments and tenants
2. Implement inline editing for quick updates
3. Add keyboard shortcuts for power users
4. Enhance error messages with actionable guidance
5. Add loading skeletons instead of simple "Loading..." text
6. Implement undo/redo for destructive operations

### Feature Enhancements
1. **Document Generation:**
   - Auto-generate payment receipts
   - Create lease renewal documents
   - Generate financial reports

2. **Communication:**
   - In-app messaging between landlord and tenant
   - SMS notifications for critical events
   - Email templates for common communications

3. **Financial Features:**
   - Late fee calculations
   - Rent escalation clauses
   - Utility bill tracking and splitting
   - Security deposit management with interest calculations

4. **Reporting:**
   - Exportable financial reports
   - Tax preparation reports
   - Occupancy rate trends
   - Payment collection reports

5. **Integrations:**
   - Accounting software integration (QuickBooks, Xero)
   - Property listing sites (Zillow, etc.)
   - Background check services
   - E-signature providers (DocuSign)

---

## Deployment & Infrastructure

### Current Setup
- **Backend:** ASP.NET Core API
- **Frontend:** React SPA
- **Database:** PostgreSQL
- **Authentication:** Zitadel (external service)
- **Payments:** Stripe (external service)

### Environment Configuration
- Environment variables for secrets
- Docker support (docker-compose.yml present)
- Development and production configurations
- CORS configuration for frontend-backend communication

### Recommended Production Setup
1. **Hosting:**
   - Backend: Azure App Service / AWS ECS / Kubernetes
   - Frontend: Vercel / Netlify / CDN
   - Database: Managed PostgreSQL (Azure Database, AWS RDS)

2. **Monitoring:**
   - Application Insights / New Relic
   - Error tracking (Sentry)
   - Performance monitoring
   - User analytics

3. **CI/CD:**
   - Automated testing pipeline
   - Automated deployment
   - Database migration automation
   - Environment promotion workflows

---

## Conclusion

Rent Manager is a robust, feature-rich property management platform with strong foundations in core property, tenant, payment, and contract management. The application demonstrates modern architectural patterns, security best practices, and user-centered design.

### Key Strengths
1. Comprehensive feature coverage for property management
2. Flexible tenant support (individuals and companies)
3. Sophisticated payment processing with Romanian market support
4. Strong role-based security model
5. Excellent responsive design
6. Multi-role user support
7. Self-service tenant onboarding

### Next Phase Priorities
1. Implement email notification system
2. Persist tenant invitations to database
3. Add maintenance request management
4. Implement document generation
5. Enhance reporting capabilities
6. Add bulk operations support
7. Complete system settings implementation

### Business Readiness
The application is **production-ready for core workflows** (property, tenant, payment management) but would benefit from the identified enhancements for a complete commercial offering. The foundation is solid for rapid iteration and feature expansion.

---

**Document Prepared By:** Mary, Business Analyst & Strategic Partner
**For:** Rent Manager Development Team
**Date:** October 26, 2025
**Version:** 1.0
