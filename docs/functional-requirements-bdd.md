# Rent Manager - Functional Requirements (BDD Format)

**Document Version:** 1.0
**Last Updated:** 2025-11-18
**Project:** Rent Manager Application

---

## Table of Contents

1. [Authentication & User Management](#epic-1-authentication--user-management)
2. [Property Management](#epic-2-property-management)
3. [Tenant Management](#epic-3-tenant-management)
4. [Payment Processing](#epic-4-payment-processing)
5. [Stripe Connect Integration](#epic-5-stripe-connect-integration)
6. [Contract Management](#epic-6-contract-management)
7. [Maintenance Request Management](#epic-7-maintenance-request-management)
8. [Document Management](#epic-8-document-management)
9. [Financial Reporting & Analytics](#epic-9-financial-reporting--analytics)
10. [Dashboard & Insights](#epic-10-dashboard--insights)
11. [Privacy & Compliance/GDPR](#epic-11-privacy--compliancegdpr)
12. [Account Settings & Preferences](#epic-12-account-settings--preferences)
13. [Notifications & Communication](#epic-13-notifications--communication)

---

## Epic 1: Authentication & User Management

### Feature 1.1: User Registration

#### User Story 1.1.1: New User Registration
**As a** new user
**I want** to register for an account
**So that** I can access the Rent Manager application

**Acceptance Criteria:**

1. **Given** I am on the registration page
   **When** I provide valid email, first name, last name, password, and select a role (Renter/PropertyOwner)
   **Then** my account is created successfully and I receive a confirmation

2. **Given** I am registering with an existing email
   **When** I submit the registration form
   **Then** I receive an error message indicating the email is already in use

3. **Given** I provide an invalid email format
   **When** I attempt to register
   **Then** I receive a validation error for the email field

4. **Given** I provide a weak password
   **When** I attempt to register
   **Then** I receive validation errors specifying password requirements

5. **Given** I successfully register
   **When** my account is created
   **Then** a Person record is created with my personal details and linked to my User account

#### User Story 1.1.2: Welcome Email on Registration
**As a** newly registered user
**I want** to receive a welcome email
**So that** I know my registration was successful and can get started

**Acceptance Criteria:**

1. **Given** I have successfully registered
   **When** my account is created
   **Then** I receive a welcome email with getting started instructions

2. **Given** a welcome email is sent
   **When** the email delivery fails
   **Then** the system logs the failure and retries up to 3 times

3. **Given** I receive the welcome email
   **When** I open it
   **Then** I see personalized content with my name and relevant next steps

---

### Feature 1.2: User Login

#### User Story 1.2.1: Standard Login
**As a** registered user
**I want** to log in with my email and password
**So that** I can access my account

**Acceptance Criteria:**

1. **Given** I have valid credentials
   **When** I submit my email and password
   **Then** I am authenticated and receive a JWT token

2. **Given** I provide incorrect credentials
   **When** I attempt to log in
   **Then** I receive an error message and login is denied

3. **Given** I successfully log in
   **When** authentication succeeds
   **Then** my LastLoginAt timestamp is updated

4. **Given** my account is inactive
   **When** I attempt to log in
   **Then** I receive an error message indicating my account is deactivated

5. **Given** I am already logged in
   **When** I access protected resources
   **Then** my JWT token is validated and I can access my authorized resources

---

### Feature 1.3: Password Management

#### User Story 1.3.1: Password Reset Request
**As a** user who forgot their password
**I want** to request a password reset
**So that** I can regain access to my account

**Acceptance Criteria:**

1. **Given** I am on the password reset page
   **When** I enter my registered email address
   **Then** I receive a password reset email with a secure token

2. **Given** I enter an email that doesn't exist in the system
   **When** I submit the password reset request
   **Then** I receive a generic success message (for security reasons)

3. **Given** I receive a password reset email
   **When** the email is sent
   **Then** the reset token expires after 1 hour

4. **Given** I request multiple password resets
   **When** I submit additional requests
   **Then** previous tokens are invalidated and only the latest token is valid

#### User Story 1.3.2: Password Reset Completion
**As a** user with a password reset token
**I want** to set a new password
**So that** I can log in again

**Acceptance Criteria:**

1. **Given** I have a valid reset token
   **When** I provide a new valid password
   **Then** my password is updated and I can log in with the new credentials

2. **Given** my reset token has expired
   **When** I attempt to reset my password
   **Then** I receive an error and must request a new reset token

3. **Given** I provide a weak new password
   **When** I attempt to complete the reset
   **Then** I receive validation errors for password requirements

---

### Feature 1.4: User Profile Management

#### User Story 1.4.1: View Profile Information
**As a** logged-in user
**I want** to view my profile information
**So that** I can verify my account details

**Acceptance Criteria:**

1. **Given** I am authenticated
   **When** I navigate to my profile
   **Then** I see my email, first name, middle name, last name, roles, and account status

2. **Given** I have a linked Person record
   **When** I view my profile
   **Then** I see my complete personal information including phone number if provided

3. **Given** I view my profile
   **When** the page loads
   **Then** I see my CreatedAt and LastLoginAt timestamps

#### User Story 1.4.2: Update Profile Information
**As a** logged-in user
**I want** to update my profile information
**So that** my account details remain current

**Acceptance Criteria:**

1. **Given** I am on my profile edit page
   **When** I update my first name, middle name, or last name
   **Then** my Person record is updated accordingly

2. **Given** I update my email address
   **When** I save the changes
   **Then** my email is updated after validation and UpdatedAt timestamp is refreshed

3. **Given** I provide invalid information
   **When** I attempt to save
   **Then** I receive validation errors and changes are not saved

4. **Given** I change my email to one already in use
   **When** I attempt to save
   **Then** I receive an error indicating the email is already taken

---

### Feature 1.5: User Administration

#### User Story 1.5.1: Admin View All Users
**As an** administrator
**I want** to view all users in the system
**So that** I can manage user accounts

**Acceptance Criteria:**

1. **Given** I am an Admin
   **When** I access the user management page
   **Then** I see a list of all users with their email, name, roles, and status

2. **Given** the system has many users
   **When** I view the user list
   **Then** I can search, filter, and sort users by various criteria

3. **Given** I view a user in the list
   **When** the user data loads
   **Then** I see their CreatedAt, UpdatedAt, and LastLoginAt information

#### User Story 1.5.2: Admin Update User Roles
**As an** administrator
**I want** to modify user roles
**So that** I can grant or revoke permissions

**Acceptance Criteria:**

1. **Given** I am editing a user account
   **When** I add or remove roles (Admin, PropertyOwner, Renter)
   **Then** the user's roles are updated and take effect immediately

2. **Given** I assign the PropertyOwner role
   **When** the role is added
   **Then** the user gains access to property management features

3. **Given** I remove all roles from a user
   **When** I save the changes
   **Then** I receive a validation error requiring at least one role

#### User Story 1.5.3: Admin Deactivate/Activate Users
**As an** administrator
**I want** to deactivate or activate user accounts
**So that** I can control access to the system

**Acceptance Criteria:**

1. **Given** I am viewing a user account
   **When** I toggle the IsActive status to false
   **Then** the user is immediately logged out and cannot log in again

2. **Given** a deactivated user attempts to log in
   **When** they submit valid credentials
   **Then** they receive an error message indicating their account is inactive

3. **Given** I reactivate a deactivated account
   **When** I set IsActive to true
   **Then** the user can log in again immediately

---

## Epic 2: Property Management

### Feature 2.1: Property CRUD Operations

#### User Story 2.1.1: Create Property
**As a** property owner
**I want** to add a new property to the system
**So that** I can manage it and assign tenants

**Acceptance Criteria:**

1. **Given** I am a property owner
   **When** I provide property name, address, type, and rent amount
   **Then** a new property is created and linked to my account

2. **Given** I am creating a property
   **When** I specify property type as Apartment or House
   **Then** I can provide bedrooms and bathrooms information

3. **Given** I am creating a parking space property
   **When** I select ParkingSpace type
   **Then** I can specify parking type (Outdoor, Covered, Garage, Underground) and space number

4. **Given** I create a property
   **When** the property is saved
   **Then** CreatedAt and UpdatedAt timestamps are automatically set

5. **Given** I provide invalid data
   **When** I attempt to create a property
   **Then** I receive validation errors and the property is not created

#### User Story 2.1.2: View Property Details
**As a** property owner
**I want** to view detailed information about my properties
**So that** I can review and manage them

**Acceptance Criteria:**

1. **Given** I own properties
   **When** I access my property list
   **Then** I see all properties with their name, address, type, and rent amount

2. **Given** I select a specific property
   **When** the details load
   **Then** I see complete information including bedrooms, bathrooms, description, parking, square footage

3. **Given** I view a property
   **When** the property has active tenants
   **Then** I see the list of current tenants

4. **Given** I view a property
   **When** the property has multiple owners
   **Then** I see all co-owners listed

#### User Story 2.1.3: Update Property
**As a** property owner
**I want** to update property information
**So that** I can keep property details current

**Acceptance Criteria:**

1. **Given** I own a property
   **When** I update any property field and save
   **Then** the changes are persisted and UpdatedAt is refreshed

2. **Given** I update the rent amount
   **When** the property has active tenants
   **Then** the change is saved but existing tenant rent amounts are not automatically changed

3. **Given** I provide invalid data
   **When** I attempt to save
   **Then** I receive validation errors and changes are not persisted

#### User Story 2.1.4: Delete Property
**As a** property owner
**I want** to delete a property
**So that** I can remove properties I no longer manage

**Acceptance Criteria:**

1. **Given** I own a property with no active tenants
   **When** I delete the property
   **Then** the property is removed from the system

2. **Given** I attempt to delete a property with active tenants
   **When** I submit the deletion
   **Then** I receive an error preventing deletion until tenants are removed

3. **Given** I delete a property
   **When** the property has historical data (past payments, contracts)
   **Then** I receive a warning about data retention requirements

---

### Feature 2.2: Property Search and Filtering

#### User Story 2.2.1: Search Properties
**As a** property owner with multiple properties
**I want** to search and filter my property list
**So that** I can quickly find specific properties

**Acceptance Criteria:**

1. **Given** I have many properties
   **When** I search by property name or address
   **Then** I see only matching properties

2. **Given** I filter by property type
   **When** I select Apartment, House, Condo, Commercial, or ParkingSpace
   **Then** only properties of that type are displayed

3. **Given** I filter by tenant occupancy
   **When** I select "vacant" or "occupied"
   **Then** properties are filtered based on whether they have active tenants

4. **Given** I apply multiple filters
   **When** I search with combined criteria
   **Then** results match all specified filters

---

### Feature 2.3: Multi-Owner Property Management

#### User Story 2.3.1: Add Co-Owner to Property
**As a** property owner
**I want** to add co-owners to my property
**So that** we can jointly manage it

**Acceptance Criteria:**

1. **Given** I own a property
   **When** I add another user as a co-owner
   **Then** both users can view and manage the property

2. **Given** I add a co-owner
   **When** the addition is successful
   **Then** the PropertyOwner relationship is created with appropriate ownership percentage if specified

3. **Given** I add a non-existent user as co-owner
   **When** I attempt the addition
   **Then** I receive an error indicating the user doesn't exist

---

## Epic 3: Tenant Management

### Feature 3.1: Tenant Invitations

#### User Story 3.1.1: Send Tenant Invitation
**As a** property owner
**I want** to invite tenants to my property
**So that** they can onboard and access their tenant portal

**Acceptance Criteria:**

1. **Given** I own a property
   **When** I send an invitation with a tenant's email
   **Then** a TenantInvitation is created with a unique token and 7-day expiration

2. **Given** I send an invitation
   **When** the invitation is created
   **Then** the tenant receives an invitation email with an onboarding link

3. **Given** I include pre-filled lease information
   **When** I send the invitation
   **Then** the invitation includes rent amount, lease start/end dates, and deposit

4. **Given** I send an invitation to an existing tenant
   **When** the email already has an active invitation
   **Then** I receive an error or the previous invitation is cancelled

5. **Given** an invitation is sent
   **When** the tenant doesn't respond within 7 days
   **Then** the invitation status automatically changes to Expired

#### User Story 3.1.2: Resend Tenant Invitation
**As a** property owner
**I want** to resend expired or pending invitations
**So that** tenants have another chance to onboard

**Acceptance Criteria:**

1. **Given** an invitation has expired
   **When** I resend the invitation
   **Then** a new invitation with a fresh token and expiration is created

2. **Given** I resend an invitation
   **When** the new invitation is created
   **Then** the previous invitation is marked as Cancelled

3. **Given** I resend an invitation
   **When** the operation succeeds
   **Then** the tenant receives a new invitation email

#### User Story 3.1.3: Cancel Tenant Invitation
**As a** property owner
**I want** to cancel pending invitations
**So that** I can prevent unwanted onboarding

**Acceptance Criteria:**

1. **Given** I have sent an invitation
   **When** I cancel it before the tenant accepts
   **Then** the invitation status changes to Cancelled and the token becomes invalid

2. **Given** a tenant tries to use a cancelled invitation
   **When** they access the onboarding link
   **Then** they receive an error message indicating the invitation is no longer valid

---

### Feature 3.2: Tenant Onboarding

#### User Story 3.2.1: Tenant Self-Registration via Invitation
**As an** invited tenant
**I want** to complete my onboarding using the invitation link
**So that** I can access my tenant portal

**Acceptance Criteria:**

1. **Given** I have a valid invitation token
   **When** I access the onboarding link
   **Then** I see a pre-filled form with my email and property details

2. **Given** I complete the onboarding form
   **When** I provide my name, phone, password, and emergency contact
   **Then** a User account and Tenant record are created for me

3. **Given** I complete onboarding
   **When** my account is created
   **Then** the invitation status changes to Accepted

4. **Given** the invitation included pre-filled lease information
   **When** I complete onboarding
   **Then** my Tenant record includes the lease start/end dates, rent amount, and deposit

5. **Given** I try to use an expired or cancelled invitation
   **When** I access the link
   **Then** I receive an error and cannot complete onboarding

#### User Story 3.2.2: Tenant Provides Additional Information
**As a** tenant during onboarding
**I want** to provide additional information
**So that** the property owner has complete records

**Acceptance Criteria:**

1. **Given** I am completing onboarding
   **When** I provide number of occupants and pet information
   **Then** this information is stored in my tenant profile

2. **Given** I provide emergency contact information
   **When** I save the information
   **Then** emergency contact name, phone, and relation are stored

---

### Feature 3.3: Tenant Management

#### User Story 3.3.1: View Tenants
**As a** property owner
**I want** to view all my tenants
**So that** I can see who is renting my properties

**Acceptance Criteria:**

1. **Given** I own properties with tenants
   **When** I view my tenant list
   **Then** I see all tenants with their name, email, property, and lease status

2. **Given** I view a specific tenant
   **When** I access their details
   **Then** I see complete information including lease dates, rent amount, deposit, and contact information

3. **Given** I view a tenant
   **When** they have emergency contacts
   **Then** I can see emergency contact details

4. **Given** I filter tenants by status
   **When** I select Active, Inactive, or Pending
   **Then** only tenants with that status are displayed

#### User Story 3.3.2: Update Tenant Information
**As a** property owner
**I want** to update tenant information
**So that** records remain accurate

**Acceptance Criteria:**

1. **Given** I have a tenant
   **When** I update their lease dates, rent amount, or deposit
   **Then** the changes are saved and UpdatedAt is refreshed

2. **Given** I update a tenant's status
   **When** I change from Active to Inactive
   **Then** the tenant's access to tenant features may be restricted

3. **Given** I update tenant information
   **When** changes are saved
   **Then** the tenant is notified if the changes affect their lease terms

#### User Story 3.3.3: Remove Tenant
**As a** property owner
**I want** to remove a tenant from a property
**So that** I can update occupancy when leases end

**Acceptance Criteria:**

1. **Given** a tenant's lease has ended
   **When** I remove the tenant
   **Then** their status changes to Inactive and they lose access to tenant-specific features

2. **Given** I remove a tenant
   **When** they have outstanding payments
   **Then** I receive a warning but can still proceed

3. **Given** I remove a tenant
   **When** the removal succeeds
   **Then** historical data (payments, contracts, maintenance requests) is retained

---

### Feature 3.4: Tenant Self-Service

#### User Story 3.4.1: Tenant View Own Information
**As a** tenant
**I want** to view my lease and property information
**So that** I can stay informed about my rental

**Acceptance Criteria:**

1. **Given** I am a logged-in tenant
   **When** I access my tenant dashboard
   **Then** I see my property details, lease dates, rent amount, and deposit

2. **Given** I view my tenant information
   **When** the page loads
   **Then** I see my emergency contact information and can update it

3. **Given** I am a tenant
   **When** I view my dashboard
   **Then** I can see my payment history and upcoming rent due dates

#### User Story 3.4.2: Tenant Update Contact Information
**As a** tenant
**I want** to update my contact information
**So that** my landlord can reach me

**Acceptance Criteria:**

1. **Given** I am logged in as a tenant
   **When** I update my phone number or email
   **Then** the changes are saved and the property owner can see the updated information

2. **Given** I update my emergency contact
   **When** I save the changes
   **Then** the new emergency contact information is stored

---

### Feature 3.5: Company Tenants

#### User Story 3.5.1: Add Company as Tenant
**As a** property owner
**I want** to add a company as a tenant
**So that** I can lease to corporate entities

**Acceptance Criteria:**

1. **Given** I am adding a tenant
   **When** I select TenantType as Company
   **Then** I can provide company name, registration number, tax ID, and company contact information

2. **Given** I create a company tenant
   **When** the tenant is saved
   **Then** a Company record is created and linked to the Tenant record

3. **Given** a company tenant is created
   **When** I view the tenant details
   **Then** I see the company name displayed instead of a person's name

---

## Epic 4: Payment Processing

### Feature 4.1: Manual Payment Recording

#### User Story 4.1.1: Record Cash Payment
**As a** property owner
**I want** to record cash payments from tenants
**So that** I can track all rent payments

**Acceptance Criteria:**

1. **Given** I receive cash from a tenant
   **When** I create a payment record with method Cash
   **Then** the payment is saved with status Completed

2. **Given** I record a payment
   **When** I provide amount, date, tenant, and optional notes
   **Then** all information is stored and the payment appears in payment history

3. **Given** I record a payment
   **When** the payment is saved
   **Then** CreatedAt and ProcessedAt timestamps are set

4. **Given** I record a payment
   **When** the operation succeeds
   **Then** the tenant receives a payment confirmation email

#### User Story 4.1.2: Record Bank Transfer Payment
**As a** property owner
**I want** to record bank transfer payments
**So that** I can track transfers with bank details

**Acceptance Criteria:**

1. **Given** I receive a bank transfer
   **When** I create a payment record with method BankTransfer
   **Then** I can provide bank IBAN, account holder, payment reference, and confirmation code

2. **Given** I record a bank transfer
   **When** Romanian-specific fields are provided
   **Then** the payment reference, IBAN, account holder, and confirmation code are stored

3. **Given** I record a bank transfer
   **When** the payment is saved
   **Then** the tenant can view the payment in their payment history

#### User Story 4.1.3: Record Check Payment
**As a** property owner
**I want** to record check payments
**So that** I can track payments made by check

**Acceptance Criteria:**

1. **Given** I receive a check from a tenant
   **When** I create a payment with method Check
   **Then** the payment is recorded with relevant check information in notes

2. **Given** I record a check payment
   **When** the check clears
   **Then** I can update the payment status to Completed

---

### Feature 4.2: Online Payment Processing

#### User Story 4.2.1: Process Online Credit Card Payment
**As a** tenant
**I want** to pay rent online with a credit card
**So that** I can pay conveniently

**Acceptance Criteria:**

1. **Given** I am viewing my outstanding rent
   **When** I select pay online with credit card
   **Then** I am directed to a secure payment gateway (Stripe)

2. **Given** I complete the payment on Stripe
   **When** the payment is successful
   **Then** a Payment record is created with status Completed and method CardOnline

3. **Given** the payment is processed
   **When** Stripe confirms the payment
   **Then** the ExternalTransactionId and PaymentGatewayProvider are recorded

4. **Given** I make an online payment
   **When** the payment succeeds
   **Then** I receive a payment confirmation email

5. **Given** the payment fails
   **When** Stripe rejects the transaction
   **Then** the Payment status is set to Failed and FailureReason is recorded

#### User Story 4.2.2: Idempotent Payment Processing
**As a** system
**I want** to prevent duplicate payment processing
**So that** tenants are not charged multiple times

**Acceptance Criteria:**

1. **Given** a payment is being processed
   **When** the same payment request is sent again with the same IdempotencyKey
   **Then** the duplicate request is rejected

2. **Given** a payment with a unique IdempotencyKey
   **When** the payment is processed
   **Then** the IdempotencyKey is stored and used for future duplicate detection

---

### Feature 4.3: Payment History

#### User Story 4.3.1: View Payment History
**As a** property owner
**I want** to view payment history
**So that** I can track all received payments

**Acceptance Criteria:**

1. **Given** I have received payments
   **When** I view payment history
   **Then** I see all payments with date, amount, tenant, property, method, and status

2. **Given** I filter payments by date range
   **When** I specify start and end dates
   **Then** only payments within that range are displayed

3. **Given** I filter payments by tenant
   **When** I select a specific tenant
   **Then** only payments from that tenant are shown

4. **Given** I filter payments by property
   **When** I select a specific property
   **Then** only payments for that property are shown

5. **Given** I view payment details
   **When** I click on a payment
   **Then** I see complete information including notes, bank details, and processing information

#### User Story 4.3.2: Tenant View Own Payment History
**As a** tenant
**I want** to view my payment history
**So that** I can track my rent payments

**Acceptance Criteria:**

1. **Given** I am a logged-in tenant
   **When** I access my payment history
   **Then** I see all my payments with date, amount, method, and status

2. **Given** I view my payment history
   **When** I select a specific payment
   **Then** I see detailed information including confirmation codes and receipts

3. **Given** I need proof of payment
   **When** I view a payment
   **Then** I can download or print a payment receipt

---

### Feature 4.4: Refunds

#### User Story 4.4.1: Process Refund
**As a** property owner
**I want** to refund a payment
**So that** I can return money for overpayments or deposit returns

**Acceptance Criteria:**

1. **Given** I have received a payment
   **When** I initiate a refund with a reason
   **Then** a new Payment record is created with IsRefunded set to true

2. **Given** I refund a payment
   **When** the refund is processed
   **Then** the original payment's IsRefunded flag is set to true and RefundedAt is recorded

3. **Given** I refund an online payment
   **When** the original payment was through Stripe
   **Then** the refund is processed through Stripe gateway

4. **Given** I refund a payment
   **When** the refund succeeds
   **Then** the tenant is notified of the refund

---

### Feature 4.5: Late Fees

#### User Story 4.5.1: Apply Late Fee
**As a** property owner
**I want** to apply late fees for overdue payments
**So that** I can enforce payment deadlines

**Acceptance Criteria:**

1. **Given** rent is overdue
   **When** the grace period expires
   **Then** a late fee payment record can be created

2. **Given** I apply a late fee
   **When** the fee is created
   **Then** the tenant is notified and can see it in their payment history

3. **Given** a late fee is applied
   **When** the tenant pays the late fee
   **Then** it is tracked as a separate payment

---

### Feature 4.6: Recurring Payments

#### User Story 4.6.1: Track Recurring Monthly Rent
**As a** property owner
**I want** to track recurring monthly rent payments
**So that** I can monitor payment patterns

**Acceptance Criteria:**

1. **Given** I record a payment
   **When** I mark it as recurring and specify the month
   **Then** IsRecurring is set to true and RecurringForMonth is recorded

2. **Given** I view payments for a tenant
   **When** filtering by month
   **Then** I can see if that month's rent has been paid

3. **Given** rent is due for a month
   **When** no payment exists for that month
   **Then** the tenant sees the outstanding amount in their dashboard

---

## Epic 5: Stripe Connect Integration

### Feature 5.1: Stripe Connect Account Setup

#### User Story 5.1.1: Property Owner Initiates Stripe Onboarding
**As a** property owner
**I want** to connect my Stripe account
**So that** I can receive online payments from tenants

**Acceptance Criteria:**

1. **Given** I am a property owner without a Stripe Connect account
   **When** I initiate Stripe onboarding
   **Then** a StripeConnectAccount record is created with status PendingOnboarding

2. **Given** I start Stripe onboarding
   **When** the account is created
   **Then** I receive an OnboardingUrl that redirects me to Stripe's onboarding flow

3. **Given** I receive the onboarding URL
   **When** I access it
   **Then** the URL is valid for 24 hours as indicated by OnboardingUrlExpiresAt

4. **Given** I complete Stripe onboarding
   **When** Stripe confirms completion
   **Then** my account status changes to Active and OnboardingCompleted is set to true

5. **Given** my Stripe onboarding is incomplete
   **When** I return to the platform
   **Then** I can resume onboarding with a refreshed URL

#### User Story 5.1.2: Stripe Account Verification
**As a** property owner
**I want** my identity verified by Stripe
**So that** I can receive payouts

**Acceptance Criteria:**

1. **Given** I complete Stripe onboarding
   **When** Stripe verifies my identity
   **Then** IdentityVerified is set to true and VerifiedAt is recorded

2. **Given** Stripe requires additional documents
   **When** verification is incomplete
   **Then** DocumentsRequired is set to true and RequiredDocuments lists needed items

3. **Given** my account requires documents
   **When** I log in
   **Then** I see a notification to complete verification

4. **Given** I provide required documents
   **When** Stripe approves them
   **Then** my account becomes fully active

---

### Feature 5.2: Payment Routing with Stripe Connect

#### User Story 5.2.1: Route Payment to Property Owner
**As a** system
**I want** to route tenant payments to property owner's Stripe account
**So that** owners receive their rent payments

**Acceptance Criteria:**

1. **Given** a tenant makes an online payment
   **When** the payment is processed
   **Then** funds are routed to the property owner's Stripe Connect account

2. **Given** a payment is routed
   **When** Stripe processes the transfer
   **Then** StripeConnectAccountId, TransferAmount, and StripeTransferId are recorded

3. **Given** a payment is routed
   **When** the platform takes a fee
   **Then** PlatformFee is deducted and recorded in the Payment record

4. **Given** the transfer succeeds
   **When** Stripe confirms
   **Then** TransferCompleted is set to true and TransferredAt is recorded

5. **Given** the transfer fails
   **When** Stripe returns an error
   **Then** the error is logged and the owner is notified

#### User Story 5.2.2: Handle Platform Fees
**As a** platform
**I want** to collect a fee on each transaction
**So that** I can sustain the platform

**Acceptance Criteria:**

1. **Given** a tenant payment is processed
   **When** funds are transferred to the owner
   **Then** a platform fee (e.g., 2-5%) is retained

2. **Given** a payment is made
   **When** calculating the transfer
   **Then** TransferAmount = Amount - PlatformFee - ProcessingFee

3. **Given** platform fees are collected
   **When** viewing payment details
   **Then** the breakdown shows Amount, PlatformFee, ProcessingFee, and TransferAmount

---

### Feature 5.3: Stripe Connect Account Management

#### User Story 5.3.1: View Stripe Account Status
**As a** property owner
**I want** to view my Stripe Connect account status
**So that** I know if I can receive payments

**Acceptance Criteria:**

1. **Given** I have a Stripe Connect account
   **When** I view my account settings
   **Then** I see my account status (PendingOnboarding, Active, Restricted, etc.)

2. **Given** I view my Stripe account
   **When** the page loads
   **Then** I see CanAcceptPayments and CanCreatePayouts capabilities

3. **Given** my account is restricted
   **When** I view the details
   **Then** I see the DisabledReason and steps to resolve it

#### User Story 5.3.2: Update Payout Settings
**As a** property owner
**I want** to configure my payout schedule
**So that** I control when I receive funds

**Acceptance Criteria:**

1. **Given** I have an active Stripe account
   **When** I access payout settings
   **Then** I can choose manual, daily, weekly, or monthly payout schedule

2. **Given** I update payout settings
   **When** I save changes
   **Then** DefaultPayoutSchedule is updated in my StripeConnectAccount record

3. **Given** I am eligible for instant payouts
   **When** I enable the feature
   **Then** InstantPayoutsEnabled is set to true

#### User Story 5.3.3: View Bank Account Information
**As a** property owner
**I want** to view my connected bank account
**So that** I can verify payout destination

**Acceptance Criteria:**

1. **Given** I have connected a bank account via Stripe
   **When** I view my payout settings
   **Then** I see the last 4 digits of my bank account and bank name

2. **Given** I need to change my bank account
   **When** I access Stripe settings
   **Then** I am redirected to Stripe's dashboard to update banking information

---

### Feature 5.4: Stripe Webhooks

#### User Story 5.4.1: Process Stripe Webhook Events
**As a** system
**I want** to receive and process Stripe webhooks
**So that** I can update account and payment statuses in real-time

**Acceptance Criteria:**

1. **Given** Stripe sends a webhook event
   **When** the event is received
   **Then** the webhook signature is validated before processing

2. **Given** an account.updated event is received
   **When** the webhook is processed
   **Then** the StripeConnectAccount record is updated with the latest information

3. **Given** a payment_intent.succeeded event is received
   **When** the webhook is processed
   **Then** the Payment status is updated to Completed

4. **Given** a transfer.created event is received
   **When** the webhook is processed
   **Then** the Payment record is updated with transfer information

5. **Given** webhook processing fails
   **When** an error occurs
   **Then** the error is logged and Stripe will retry

---

## Epic 6: Contract Management

### Feature 6.1: Contract Upload

#### User Story 6.1.1: Upload Lease Contract
**As a** property owner
**I want** to upload lease contracts
**So that** I can store them securely

**Acceptance Criteria:**

1. **Given** I have a tenant assigned to a property
   **When** I upload a contract file (PDF, DOC, DOCX)
   **Then** the contract is saved as base64 in the Contract record

2. **Given** I upload a contract
   **When** the upload succeeds
   **Then** FileName, MimeType, FileSizeBytes, and UploadedAt are recorded

3. **Given** I upload a contract
   **When** the file is too large (>10MB)
   **Then** I receive an error and the upload is rejected

4. **Given** I upload a contract
   **When** the upload succeeds
   **Then** the tenant receives a notification email

5. **Given** I upload a contract
   **When** the contract is saved
   **Then** the status is set to Draft by default

#### User Story 6.1.2: Set Contract Status
**As a** property owner
**I want** to set contract status
**So that** I can track contract lifecycle

**Acceptance Criteria:**

1. **Given** I have uploaded a contract
   **When** I change status to Pending
   **Then** the tenant is notified to review and sign

2. **Given** a contract is pending
   **When** the tenant signs it
   **Then** status changes to Signed and SignedAt is recorded

3. **Given** a lease ends
   **When** I update the contract
   **Then** I can set status to Terminated

---

### Feature 6.2: Contract Viewing

#### User Story 6.2.1: Property Owner View Contracts
**As a** property owner
**I want** to view contracts for my properties
**So that** I can access lease agreements

**Acceptance Criteria:**

1. **Given** I have uploaded contracts
   **When** I access the contracts page
   **Then** I see all contracts with tenant name, property, status, and upload date

2. **Given** I select a contract
   **When** I view details
   **Then** I can download the contract file

3. **Given** I view a contract
   **When** the contract has notes
   **Then** I see the notes attached to the contract

4. **Given** I filter contracts by property
   **When** I select a property
   **Then** only contracts for that property are displayed

#### User Story 6.2.2: Tenant View Own Contracts
**As a** tenant
**I want** to view my lease contract
**So that** I can reference lease terms

**Acceptance Criteria:**

1. **Given** I am a logged-in tenant
   **When** I access my contracts
   **Then** I see all contracts related to my tenancy

2. **Given** I view a contract
   **When** I click download
   **Then** the contract file is downloaded to my device

3. **Given** a contract requires my signature
   **When** I view contracts
   **Then** I see contracts with Pending status highlighted

---

### Feature 6.3: Contract Amendments

#### User Story 6.3.1: Upload Amended Contract
**As a** property owner
**I want** to upload amended contracts
**So that** I can document lease changes

**Acceptance Criteria:**

1. **Given** a lease agreement needs updating
   **When** I upload a new version
   **Then** the new contract is created and the old one remains for historical reference

2. **Given** I upload an amended contract
   **When** the upload succeeds
   **Then** I can add notes explaining the amendments

3. **Given** an amended contract is uploaded
   **When** the tenant is notified
   **Then** they can view and compare with previous versions

---

## Epic 7: Maintenance Request Management

### Feature 7.1: Maintenance Request Submission

#### User Story 7.1.1: Tenant Submit Maintenance Request
**As a** tenant
**I want** to submit maintenance requests
**So that** property issues are addressed

**Acceptance Criteria:**

1. **Given** I am a logged-in tenant
   **When** I submit a maintenance request with title and description
   **Then** a MaintenanceRequest is created with status Pending

2. **Given** I submit a request
   **When** I select priority (Low, Medium, High, Emergency)
   **Then** the priority is recorded and the property owner is notified accordingly

3. **Given** I submit a request
   **When** the request is created
   **Then** CreatedAt timestamp is set and I receive a confirmation

4. **Given** I submit an emergency request
   **When** priority is set to Emergency
   **Then** the property owner receives an immediate high-priority notification

#### User Story 7.1.2: Attach Photos to Maintenance Request
**As a** tenant
**I want** to attach photos to maintenance requests
**So that** I can show the issue clearly

**Acceptance Criteria:**

1. **Given** I am submitting a maintenance request
   **When** I attach photos
   **Then** the images are uploaded and linked to the request

2. **Given** I attach multiple photos
   **When** the upload succeeds
   **Then** all photos are viewable by the property owner

---

### Feature 7.2: Maintenance Request Tracking

#### User Story 7.2.1: View Maintenance Requests
**As a** property owner
**I want** to view all maintenance requests
**So that** I can manage property maintenance

**Acceptance Criteria:**

1. **Given** tenants have submitted requests
   **When** I access the maintenance page
   **Then** I see all requests with title, property, tenant, status, and priority

2. **Given** I filter by status
   **When** I select Pending, InProgress, Completed, or Cancelled
   **Then** only requests with that status are displayed

3. **Given** I filter by priority
   **When** I select a priority level
   **Then** only requests with that priority are shown

4. **Given** I filter by property
   **When** I select a property
   **Then** only requests for that property are displayed

#### User Story 7.2.2: Tenant View Own Maintenance Requests
**As a** tenant
**I want** to view my submitted maintenance requests
**So that** I can track their status

**Acceptance Criteria:**

1. **Given** I have submitted maintenance requests
   **When** I access my maintenance page
   **Then** I see all my requests with status and last update time

2. **Given** I view a specific request
   **When** the request has been updated
   **Then** I see the current status and any resolution notes

3. **Given** my request is completed
   **When** I view the request
   **Then** I see ResolvedAt timestamp and resolution notes

---

### Feature 7.3: Maintenance Request Management

#### User Story 7.3.1: Update Maintenance Request Status
**As a** property owner
**I want** to update maintenance request status
**So that** tenants know the progress

**Acceptance Criteria:**

1. **Given** I have a pending request
   **When** I change status to InProgress
   **Then** UpdatedAt is refreshed and the tenant is notified

2. **Given** I complete a maintenance request
   **When** I set status to Completed and add resolution notes
   **Then** ResolvedAt is set and the tenant receives a completion notification

3. **Given** I cancel a request
   **When** I set status to Cancelled
   **Then** the tenant is notified with cancellation reason

#### User Story 7.3.2: Assign Contractor to Maintenance Request
**As a** property owner
**I want** to assign maintenance requests to contractors
**So that** work is delegated appropriately

**Acceptance Criteria:**

1. **Given** I have a maintenance request
   **When** I assign it to a contractor by setting AssignedTo
   **Then** the contractor name is recorded

2. **Given** I assign a request
   **When** the assignment is saved
   **Then** the tenant can see who is assigned to their request

3. **Given** a contractor is assigned
   **When** the contractor completes work
   **Then** I can update the status and add resolution notes

---

## Epic 8: Document Management

### Feature 8.1: Document Upload

#### User Story 8.1.1: Upload Property Documents
**As a** property owner
**I want** to upload property-related documents
**So that** I can organize important files

**Acceptance Criteria:**

1. **Given** I own a property
   **When** I upload a document (insurance, inspection reports, permits)
   **Then** the document is stored and linked to the property

2. **Given** I upload a document
   **When** the upload succeeds
   **Then** I can categorize it by document type

3. **Given** I upload sensitive documents
   **When** the document is saved
   **Then** it is encrypted and access is restricted to authorized users

#### User Story 8.1.2: Upload Tenant Documents
**As a** property owner or tenant
**I want** to upload tenant-related documents
**So that** I can store important records

**Acceptance Criteria:**

1. **Given** I am managing a tenant
   **When** I upload documents (ID, proof of income, references)
   **Then** the documents are linked to the tenant record

2. **Given** I am a tenant
   **When** I upload documents
   **Then** only I and my property owner can access them

---

### Feature 8.2: Document Organization

#### User Story 8.2.1: Categorize Documents
**As a** property owner
**I want** to categorize documents
**So that** I can find them easily

**Acceptance Criteria:**

1. **Given** I have uploaded documents
   **When** I assign categories (Contracts, Insurance, Inspections, Financial, Legal)
   **Then** documents are organized by category

2. **Given** I filter documents by category
   **When** I select a category
   **Then** only documents in that category are displayed

3. **Given** I search documents
   **When** I enter a search term
   **Then** matching documents by name or notes are returned

---

### Feature 8.3: Document Access Control

#### User Story 8.3.1: Control Document Access
**As a** property owner
**I want** to control who can access documents
**So that** sensitive information is protected

**Acceptance Criteria:**

1. **Given** I upload a document
   **When** I set access permissions
   **Then** only authorized users can view or download it

2. **Given** a tenant-specific document exists
   **When** a tenant logs in
   **Then** they can only access their own documents

3. **Given** an admin views documents
   **When** they access the document repository
   **Then** they can see all documents with appropriate audit logging

---

## Epic 9: Financial Reporting & Analytics

### Feature 9.1: Income Reporting

#### User Story 9.1.1: View Income Summary
**As a** property owner
**I want** to view income summary reports
**So that** I can track rental income

**Acceptance Criteria:**

1. **Given** I have received payments
   **When** I access the income report
   **Then** I see total income for the selected period

2. **Given** I select a date range
   **When** I generate the report
   **Then** I see income broken down by property

3. **Given** I view income reports
   **When** the data loads
   **Then** I see monthly trends and year-over-year comparisons

4. **Given** I need detailed information
   **When** I drill down on a property
   **Then** I see all payments contributing to that property's income

#### User Story 9.1.2: Export Income Report
**As a** property owner
**I want** to export income reports
**So that** I can use the data in other applications

**Acceptance Criteria:**

1. **Given** I am viewing an income report
   **When** I click export
   **Then** I can download the report as CSV or PDF

2. **Given** I export a report
   **When** the export completes
   **Then** the file includes all visible data with proper formatting

---

### Feature 9.2: Expense Tracking

#### User Story 9.2.1: Record Property Expenses
**As a** property owner
**I want** to record property expenses
**So that** I can track costs

**Acceptance Criteria:**

1. **Given** I incur a property expense
   **When** I create an expense record with amount, date, category, and property
   **Then** the expense is saved and included in financial reports

2. **Given** I record expenses
   **When** I categorize them (Maintenance, Repairs, Utilities, Insurance, Taxes, Management)
   **Then** expenses are organized by category for reporting

3. **Given** I record an expense
   **When** I attach receipts
   **Then** the receipts are stored with the expense record

#### User Story 9.2.2: View Expense Reports
**As a** property owner
**I want** to view expense reports
**So that** I can analyze property costs

**Acceptance Criteria:**

1. **Given** I have recorded expenses
   **When** I access expense reports
   **Then** I see total expenses for the selected period broken down by category

2. **Given** I filter expenses by property
   **When** I select a property
   **Then** I see only expenses for that property

3. **Given** I view expense trends
   **When** the report loads
   **Then** I see monthly and yearly expense patterns

---

### Feature 9.3: Profit & Loss Reporting

#### User Story 9.3.1: Generate P&L Statement
**As a** property owner
**I want** to generate profit and loss statements
**So that** I can assess property profitability

**Acceptance Criteria:**

1. **Given** I have income and expenses
   **When** I generate a P&L report
   **Then** I see total income, total expenses, and net profit/loss

2. **Given** I select a date range
   **When** I generate the P&L
   **Then** the report covers only that period

3. **Given** I have multiple properties
   **When** I generate a consolidated P&L
   **Then** I see combined financials across all properties

4. **Given** I need property-specific P&L
   **When** I filter by property
   **Then** I see P&L for that property only

5. **Given** I view P&L statements
   **When** the data loads
   **Then** I see percentage breakdowns and profit margins

---

### Feature 9.4: Tax Reporting

#### User Story 9.4.1: Generate Tax Reports
**As a** property owner
**I want** to generate tax reports
**So that** I can prepare tax filings

**Acceptance Criteria:**

1. **Given** I need tax information
   **When** I generate a tax report for a fiscal year
   **Then** I see all income, deductible expenses, and net income

2. **Given** I generate a tax report
   **When** the report is created
   **Then** expenses are categorized according to tax deduction categories

3. **Given** I export tax reports
   **When** I download the report
   **Then** the format is compatible with accounting software

---

### Feature 9.5: Cash Flow Analysis

#### User Story 9.5.1: View Cash Flow Report
**As a** property owner
**I want** to view cash flow reports
**So that** I can monitor liquidity

**Acceptance Criteria:**

1. **Given** I access cash flow reports
   **When** the report loads
   **Then** I see cash inflows (payments) and outflows (expenses) over time

2. **Given** I view cash flow
   **When** I select a time period
   **Then** I see net cash flow for that period

3. **Given** I analyze cash flow
   **When** I view the report
   **Then** I see projections based on expected recurring payments

---

## Epic 10: Dashboard & Insights

### Feature 10.1: Property Owner Dashboard

#### User Story 10.1.1: View Dashboard Summary
**As a** property owner
**I want** to view a dashboard summary
**So that** I can see key metrics at a glance

**Acceptance Criteria:**

1. **Given** I log in as a property owner
   **When** I access my dashboard
   **Then** I see total properties, active tenants, total monthly rent, and monthly collected

2. **Given** I view my dashboard
   **When** the data loads
   **Then** I see outstanding rent amount and number of pending payments

3. **Given** I view my dashboard
   **When** the page loads
   **Then** I see recent payments list with date, tenant, amount, and method

4. **Given** I have outstanding rent
   **When** I view my dashboard
   **Then** I see a list of outstanding rent items by tenant and property

5. **Given** I view dashboard stats
   **When** data is calculated
   **Then** all amounts are accurate and up-to-date

#### User Story 10.1.2: Dashboard Quick Actions
**As a** property owner
**I want** quick action buttons on my dashboard
**So that** I can perform common tasks easily

**Acceptance Criteria:**

1. **Given** I am on my dashboard
   **When** I click "Add Property"
   **Then** I am directed to the property creation form

2. **Given** I am on my dashboard
   **When** I click "Invite Tenant"
   **Then** I am directed to the tenant invitation form

3. **Given** I am on my dashboard
   **When** I click "Record Payment"
   **Then** I am directed to the payment creation form

---

### Feature 10.2: Tenant Dashboard

#### User Story 10.2.1: View Tenant Dashboard
**As a** tenant
**I want** to view my tenant dashboard
**So that** I can see my rental information

**Acceptance Criteria:**

1. **Given** I log in as a tenant
   **When** I access my dashboard
   **Then** I see my property details, rent amount, and lease dates

2. **Given** I view my dashboard
   **When** the page loads
   **Then** I see my payment status and any outstanding amounts

3. **Given** I have upcoming rent due
   **When** I view my dashboard
   **Then** I see a notification of the upcoming payment

4. **Given** I view my dashboard
   **When** the data loads
   **Then** I see my recent payments and can access my payment history

#### User Story 10.2.2: Tenant Quick Actions
**As a** tenant
**I want** quick action buttons on my dashboard
**So that** I can perform common tasks easily

**Acceptance Criteria:**

1. **Given** I am on my dashboard
   **When** I click "Pay Rent"
   **Then** I am directed to the online payment page

2. **Given** I am on my dashboard
   **When** I click "Submit Maintenance Request"
   **Then** I am directed to the maintenance request form

3. **Given** I am on my dashboard
   **When** I click "View Contract"
   **Then** I am directed to my lease contract

---

### Feature 10.3: Financial Insights

#### User Story 10.3.1: View Financial Insights
**As a** property owner
**I want** to view financial insights
**So that** I can make informed decisions

**Acceptance Criteria:**

1. **Given** I have financial data
   **When** I access insights
   **Then** I see trends like occupancy rate, collection rate, and average rent

2. **Given** I view insights
   **When** the page loads
   **Then** I see visual charts and graphs for key metrics

3. **Given** I view insights
   **When** data is displayed
   **Then** I can toggle between different time periods (month, quarter, year)

4. **Given** I have multiple properties
   **When** I view insights
   **Then** I can compare performance across properties

---

### Feature 10.4: Notifications Dashboard

#### User Story 10.4.1: View Notifications
**As a** user
**I want** to view notifications on my dashboard
**So that** I stay informed of important events

**Acceptance Criteria:**

1. **Given** I have notifications
   **When** I access my dashboard
   **Then** I see unread notifications prominently displayed

2. **Given** I view notifications
   **When** I click on one
   **Then** I am directed to the relevant page and the notification is marked as read

3. **Given** I have many notifications
   **When** I view them
   **Then** they are organized by date and category

---

## Epic 11: Privacy & Compliance/GDPR

### Feature 11.1: Cookie Consent

#### User Story 11.1.1: Display Cookie Consent Banner
**As a** visitor
**I want** to see a cookie consent banner
**So that** I can control my privacy preferences

**Acceptance Criteria:**

1. **Given** I visit the site for the first time
   **When** the page loads
   **Then** I see a cookie consent banner

2. **Given** I see the cookie consent banner
   **When** I click "Accept All"
   **Then** my consent is recorded with all cookie categories accepted

3. **Given** I see the cookie consent banner
   **When** I click "Reject Non-Essential"
   **Then** only essential cookies are allowed

4. **Given** I provide consent
   **When** I return to the site
   **Then** the banner does not appear again

5. **Given** I want to change my consent
   **When** I access cookie settings
   **Then** I can update my preferences

#### User Story 11.1.2: Store Cookie Consent
**As a** system
**I want** to store cookie consent
**So that** I can respect user preferences

**Acceptance Criteria:**

1. **Given** a user provides consent
   **When** they accept or reject cookies
   **Then** a CookieConsent record is created with user ID, IP, and preferences

2. **Given** consent is recorded
   **When** the user visits again
   **Then** their preferences are loaded and applied

3. **Given** a user updates consent
   **When** they change preferences
   **Then** the existing CookieConsent record is updated with new preferences and timestamp

---

### Feature 11.2: Privacy Policy Management

#### User Story 11.2.1: Display Privacy Policy
**As a** user
**I want** to read the privacy policy
**So that** I understand how my data is used

**Acceptance Criteria:**

1. **Given** I visit the site
   **When** I click on "Privacy Policy"
   **Then** I see the current privacy policy version

2. **Given** I view the privacy policy
   **When** the page loads
   **Then** I see the effective date and version number

3. **Given** multiple policy versions exist
   **When** I access the privacy policy
   **Then** I see the latest version by default

#### User Story 11.2.2: Accept Privacy Policy
**As a** user
**I want** to accept the privacy policy
**So that** I can use the platform

**Acceptance Criteria:**

1. **Given** I register for an account
   **When** I complete registration
   **Then** I must accept the privacy policy to proceed

2. **Given** I accept the privacy policy
   **When** I confirm acceptance
   **Then** a UserPrivacyPolicyAcceptance record is created with acceptance timestamp and IP address

3. **Given** the privacy policy is updated
   **When** I log in
   **Then** I am prompted to accept the new version

4. **Given** I don't accept the updated policy
   **When** I decline
   **Then** my access to the platform is restricted

---

### Feature 11.3: Data Subject Rights

#### User Story 11.3.1: Request Data Access (GDPR Article 15)
**As a** user
**I want** to request access to my personal data
**So that** I can see what information is stored about me

**Acceptance Criteria:**

1. **Given** I am logged in
   **When** I submit a data access request
   **Then** a DataSubjectRequest is created with type "Access" and status "Pending"

2. **Given** I submit an access request
   **When** the request is created
   **Then** DeadlineAt is set to 30 days from submission (GDPR requirement)

3. **Given** my access request is processed
   **When** an admin completes it
   **Then** I receive an email with a download link to my data export

4. **Given** I receive a data export link
   **When** the link is generated
   **Then** it expires after 7 days for security

5. **Given** my request is fulfilled
   **When** I download my data
   **Then** I receive a JSON file with all my personal information

#### User Story 11.3.2: Request Data Deletion (GDPR Article 17)
**As a** user
**I want** to request deletion of my personal data
**So that** I can exercise my right to be forgotten

**Acceptance Criteria:**

1. **Given** I am logged in
   **When** I submit a deletion request with a reason
   **Then** a DataSubjectRequest with type "Deletion" is created

2. **Given** my deletion request is processed
   **When** an admin approves it
   **Then** my personal data is deleted according to the deletion policy

3. **Given** data is deleted
   **When** the deletion completes
   **Then** a DataDeletionLog records what was deleted and what was retained

4. **Given** some data must be retained for legal reasons
   **When** my deletion request is processed
   **Then** the RetentionSummary explains what data was kept and why

5. **Given** my data is deleted
   **When** the process completes
   **Then** I receive confirmation and my account is deactivated

#### User Story 11.3.3: Request Data Portability (GDPR Article 20)
**As a** user
**I want** to request my data in a portable format
**So that** I can transfer it to another service

**Acceptance Criteria:**

1. **Given** I am logged in
   **When** I submit a portability request
   **Then** a DataSubjectRequest with type "Portability" is created

2. **Given** my portability request is processed
   **When** an admin fulfills it
   **Then** I receive my data in a structured, commonly used, machine-readable format (JSON)

3. **Given** I receive my portable data
   **When** I download it
   **Then** it includes all data I provided and generated through platform use

#### User Story 11.3.4: Request Data Rectification (GDPR Article 16)
**As a** user
**I want** to request correction of my personal data
**So that** inaccurate information is fixed

**Acceptance Criteria:**

1. **Given** I find inaccurate data
   **When** I submit a rectification request with details
   **Then** a DataSubjectRequest with type "Rectification" is created

2. **Given** my rectification request is processed
   **When** an admin reviews it
   **Then** they can update the incorrect data directly

3. **Given** my data is corrected
   **When** the update is complete
   **Then** I receive confirmation of the changes

#### User Story 11.3.5: Request Processing Restriction (GDPR Article 18)
**As a** user
**I want** to request restriction of data processing
**So that** my data is not used while I dispute its accuracy or lawfulness

**Acceptance Criteria:**

1. **Given** I want to restrict processing
   **When** I submit a restriction request
   **Then** a DataSubjectRequest with type "Restriction" is created

2. **Given** my restriction request is approved
   **When** the restriction is applied
   **Then** my data is marked as restricted and not used for processing

3. **Given** my data is restricted
   **When** I log in
   **Then** I see a notice that my account is in restricted mode

---

### Feature 11.4: Data Subject Request Management

#### User Story 11.4.1: Admin View Data Subject Requests
**As an** administrator
**I want** to view all data subject requests
**So that** I can ensure GDPR compliance

**Acceptance Criteria:**

1. **Given** users have submitted requests
   **When** I access the request management page
   **Then** I see all requests with type, status, user, submission date, and deadline

2. **Given** I view requests
   **When** a deadline is approaching
   **Then** requests nearing deadline are highlighted

3. **Given** I filter requests
   **When** I select a status or type
   **Then** only matching requests are displayed

#### User Story 11.4.2: Admin Process Data Subject Request
**As an** administrator
**I want** to process data subject requests
**So that** I fulfill user rights

**Acceptance Criteria:**

1. **Given** I am viewing a request
   **When** I start processing it
   **Then** the status changes to InProgress and I am assigned to it

2. **Given** I process an access request
   **When** I generate the data export
   **Then** the ExportFilePath is set and the user is notified

3. **Given** I complete a request
   **When** I mark it as completed
   **Then** CompletedAt is set and the user receives confirmation

4. **Given** I must reject a request
   **When** I provide a reason and reject
   **Then** the status changes to Rejected and the user is notified

5. **Given** I process any request
   **When** status changes
   **Then** a DataSubjectRequestHistory entry is created

#### User Story 11.4.3: Identity Verification for Requests
**As an** administrator
**I want** to verify user identity for data requests
**So that** data is not disclosed to unauthorized persons

**Acceptance Criteria:**

1. **Given** a high-risk request is submitted (deletion, access)
   **When** I review it
   **Then** I can require identity verification

2. **Given** identity verification is required
   **When** the user re-authenticates
   **Then** IdentityVerified is set to true and VerifiedAt is recorded

3. **Given** identity is not verified
   **When** I attempt to process a high-risk request
   **Then** I receive a warning to verify identity first

---

### Feature 11.5: Legal Holds

#### User Story 11.5.1: Place Legal Hold on Data
**As an** administrator
**I want** to place legal holds on user data
**So that** data is preserved during legal proceedings

**Acceptance Criteria:**

1. **Given** legal proceedings require data preservation
   **When** I create a legal hold for a user
   **Then** all their data is marked as protected from deletion

2. **Given** a legal hold is active
   **When** a user requests data deletion
   **Then** the deletion is blocked and they are notified of the hold

3. **Given** a legal hold is created
   **When** the hold is placed
   **Then** the reason, start date, and responsible party are recorded

#### User Story 11.5.2: Release Legal Hold
**As an** administrator
**I want** to release legal holds
**So that** data can be deleted when proceedings conclude

**Acceptance Criteria:**

1. **Given** a legal hold is no longer needed
   **When** I release the hold
   **Then** the hold is marked as inactive and data can be deleted upon request

2. **Given** a hold is released
   **When** the release is recorded
   **Then** the release date and reason are documented

---

### Feature 11.6: Audit Trails

#### User Story 11.6.1: Log Privacy-Related Actions
**As a** system
**I want** to log all privacy-related actions
**So that** there is an audit trail for compliance

**Acceptance Criteria:**

1. **Given** a data subject request is created
   **When** the request is submitted
   **Then** the submission IP address and user agent are recorded

2. **Given** request status changes
   **When** an admin updates the request
   **Then** a history entry is created with timestamp, admin ID, and action

3. **Given** data is deleted
   **When** deletion occurs
   **Then** a DataDeletionLog records what was deleted, who authorized it, and when

4. **Given** privacy policy is accepted
   **When** a user accepts
   **Then** the acceptance is logged with timestamp, IP, and user agent

---

### Feature 11.7: Data Retention Policies

#### User Story 11.7.1: Define Data Retention Policies
**As an** administrator
**I want** to define data retention policies
**So that** data is retained or deleted according to regulations

**Acceptance Criteria:**

1. **Given** I am defining retention policies
   **When** I specify retention periods for data types
   **Then** the policies are enforced automatically

2. **Given** a retention period expires
   **When** data reaches the end of its retention period
   **Then** I receive a notification to review and delete or extend

3. **Given** data has legal retention requirements
   **When** I review deletion requests
   **Then** the system prevents deletion of data that must be retained

---

## Epic 12: Account Settings & Preferences

### Feature 12.1: Profile Settings

#### User Story 12.1.1: Update Profile Information
**As a** user
**I want** to update my profile information
**So that** my account details are current

**Acceptance Criteria:**

1. **Given** I am logged in
   **When** I access profile settings
   **Then** I can update my first name, middle name, last name, and phone number

2. **Given** I update my profile
   **When** I save changes
   **Then** my Person record is updated and UpdatedAt is refreshed

3. **Given** I provide invalid data
   **When** I attempt to save
   **Then** I receive validation errors

#### User Story 12.1.2: Change Email Address
**As a** user
**I want** to change my email address
**So that** I can update my login credentials

**Acceptance Criteria:**

1. **Given** I want to change my email
   **When** I provide a new email and verify it
   **Then** my email is updated after verification

2. **Given** I change my email
   **When** the change is confirmed
   **Then** I receive a confirmation at both old and new email addresses

3. **Given** I provide an email already in use
   **When** I attempt to save
   **Then** I receive an error indicating the email is taken

---

### Feature 12.2: Security Settings

#### User Story 12.2.1: Change Password
**As a** user
**I want** to change my password
**So that** I can maintain account security

**Acceptance Criteria:**

1. **Given** I am logged in
   **When** I provide my current password and a new password
   **Then** my password is updated

2. **Given** I provide an incorrect current password
   **When** I attempt to change
   **Then** I receive an error and the password is not changed

3. **Given** I provide a weak new password
   **When** I attempt to save
   **Then** I receive validation errors for password requirements

4. **Given** I change my password
   **When** the change succeeds
   **Then** I receive a confirmation email

#### User Story 12.2.2: View Login History
**As a** user
**I want** to view my login history
**So that** I can monitor account access

**Acceptance Criteria:**

1. **Given** I access security settings
   **When** I view login history
   **Then** I see my recent login attempts with date, time, and IP address

2. **Given** I see a suspicious login
   **When** I identify unauthorized access
   **Then** I can immediately change my password or contact support

---

### Feature 12.3: Notification Preferences

#### User Story 12.3.1: Configure Email Notifications
**As a** user
**I want** to configure which emails I receive
**So that** I control notification frequency

**Acceptance Criteria:**

1. **Given** I access notification settings
   **When** I view preferences
   **Then** I see toggles for each notification type (payments, maintenance, contracts, reminders)

2. **Given** I disable a notification type
   **When** I save preferences
   **Then** I no longer receive emails of that type

3. **Given** I enable all notifications
   **When** events occur
   **Then** I receive all relevant email notifications

4. **Given** I am a property owner
   **When** I configure notifications
   **Then** I can set preferences for payment reminders, maintenance alerts, and lease expirations

5. **Given** I am a tenant
   **When** I configure notifications
   **Then** I can set preferences for payment reminders, maintenance updates, and contract notifications

---

### Feature 12.4: Payment Settings

#### User Story 12.4.1: Manage Payment Methods
**As a** tenant
**I want** to manage saved payment methods
**So that** I can pay rent conveniently

**Acceptance Criteria:**

1. **Given** I have made online payments
   **When** I access payment settings
   **Then** I can view and manage saved payment methods

2. **Given** I add a payment method
   **When** I save it
   **Then** it is securely stored for future use

3. **Given** I delete a payment method
   **When** I remove it
   **Then** it is no longer available for payments

#### User Story 12.4.2: Set Default Payment Method
**As a** tenant
**I want** to set a default payment method
**So that** payments are faster

**Acceptance Criteria:**

1. **Given** I have multiple payment methods
   **When** I set one as default
   **Then** it is pre-selected for future payments

2. **Given** I have a default payment method
   **When** I make a payment
   **Then** the default is automatically selected

---

## Epic 13: Notifications & Communication

### Feature 13.1: Email Notifications

#### User Story 13.1.1: Send Welcome Email
**As a** system
**I want** to send welcome emails to new users
**So that** they feel welcomed and informed

**Acceptance Criteria:**

1. **Given** a user registers
   **When** their account is created
   **Then** a welcome email is sent using the WelcomeEmailJob

2. **Given** the welcome email is sent
   **When** it is delivered
   **Then** it includes personalized content with the user's name

3. **Given** email delivery fails
   **When** sending fails
   **Then** the job retries up to 3 times

#### User Story 13.1.2: Send Tenant Invitation Email
**As a** system
**I want** to send tenant invitation emails
**So that** invited tenants can onboard

**Acceptance Criteria:**

1. **Given** a property owner invites a tenant
   **When** the invitation is created
   **Then** a TenantInvitationEmailJob sends an invitation email

2. **Given** the invitation email is sent
   **When** the tenant receives it
   **Then** it includes the onboarding link with invitation token

3. **Given** the invitation includes pre-filled lease info
   **When** the email is sent
   **Then** the email mentions the property and lease terms

#### User Story 13.1.3: Send Payment Confirmation Email
**As a** system
**I want** to send payment confirmation emails
**So that** tenants have proof of payment

**Acceptance Criteria:**

1. **Given** a payment is recorded
   **When** the payment status is Completed
   **Then** a PaymentConfirmationEmailJob sends a confirmation email to the tenant

2. **Given** the confirmation email is sent
   **When** the tenant receives it
   **Then** it includes payment amount, date, property, and payment method

3. **Given** the payment was online
   **When** the confirmation is sent
   **Then** it includes the transaction ID

#### User Story 13.1.4: Send Rent Payment Reminder Email
**As a** system
**I want** to send rent payment reminders
**So that** tenants are reminded to pay on time

**Acceptance Criteria:**

1. **Given** rent is due soon (e.g., 3 days before)
   **When** the scheduled job runs
   **Then** a RentPaymentReminderEmailJob sends reminder emails to tenants

2. **Given** a reminder is sent
   **When** the tenant receives it
   **Then** it includes the amount due, due date, and payment options

3. **Given** a tenant has already paid for the month
   **When** the reminder job runs
   **Then** no reminder is sent to that tenant

#### User Story 13.1.5: Send Overdue Payment Email
**As a** system
**I want** to send overdue payment notifications
**So that** tenants are alerted to late payments

**Acceptance Criteria:**

1. **Given** rent is overdue
   **When** the CheckOverduePaymentsJob runs
   **Then** an OverduePaymentEmailJob sends notification emails

2. **Given** an overdue email is sent
   **When** the tenant receives it
   **Then** it includes the overdue amount, number of days late, and potential late fees

3. **Given** multiple payments are overdue
   **When** the job runs
   **Then** a single consolidated email is sent listing all overdue amounts

#### User Story 13.1.6: Send Lease Expiration Email
**As a** system
**I want** to send lease expiration reminders
**So that** property owners and tenants are notified

**Acceptance Criteria:**

1. **Given** a lease is expiring soon (e.g., 30 days)
   **When** the CheckLeaseExpirationsJob runs
   **Then** a LeaseExpirationEmailJob sends notifications to both owner and tenant

2. **Given** an expiration email is sent
   **When** the recipient receives it
   **Then** it includes the lease end date and renewal options

3. **Given** a lease has expired
   **When** the notification is sent
   **Then** it prompts action to renew or terminate

#### User Story 13.1.7: Send Contract Upload Email
**As a** system
**I want** to notify tenants when contracts are uploaded
**So that** they know to review them

**Acceptance Criteria:**

1. **Given** a property owner uploads a contract
   **When** the upload succeeds
   **Then** a ContractUploadEmailJob sends a notification to the tenant

2. **Given** the notification is sent
   **When** the tenant receives it
   **Then** it includes a link to view the contract

3. **Given** the contract requires signature
   **When** the email is sent
   **Then** it prompts the tenant to review and sign

---

### Feature 13.2: In-App Notifications

#### User Story 13.2.1: Receive In-App Notifications
**As a** user
**I want** to receive in-app notifications
**So that** I see important updates while using the platform

**Acceptance Criteria:**

1. **Given** an event occurs that requires notification
   **When** I am logged in
   **Then** I see a notification badge on the notification icon

2. **Given** I have unread notifications
   **When** I click the notification icon
   **Then** I see a dropdown with recent notifications

3. **Given** I view notifications
   **When** the dropdown opens
   **Then** notifications are ordered by date with newest first

4. **Given** I click on a notification
   **When** I select it
   **Then** I am directed to the relevant page and the notification is marked as read

#### User Story 13.2.2: Mark Notifications as Read
**As a** user
**I want** to mark notifications as read
**So that** I can manage my notification list

**Acceptance Criteria:**

1. **Given** I have unread notifications
   **When** I click "Mark all as read"
   **Then** all notifications are marked as read and the badge clears

2. **Given** I view a specific notification
   **When** I click on it
   **Then** that notification is automatically marked as read

---

### Feature 13.3: Background Job Management

#### User Story 13.3.1: Schedule Recurring Email Jobs
**As a** system
**I want** to schedule recurring email jobs
**So that** periodic notifications are sent automatically

**Acceptance Criteria:**

1. **Given** the system is running
   **When** Hangfire is configured
   **Then** recurring jobs are scheduled for payment reminders, overdue checks, and lease expirations

2. **Given** a recurring job is scheduled
   **When** the scheduled time arrives
   **Then** the job executes and sends relevant notifications

3. **Given** a job fails
   **When** an error occurs
   **Then** the job is retried according to retry policy and errors are logged

#### User Story 13.3.2: Admin Monitor Background Jobs
**As an** administrator
**I want** to monitor background jobs
**So that** I can ensure notifications are being sent

**Acceptance Criteria:**

1. **Given** I am an admin
   **When** I access the Hangfire dashboard
   **Then** I see all scheduled, processing, succeeded, and failed jobs

2. **Given** I view job details
   **When** I click on a job
   **Then** I see execution history, parameters, and any error messages

3. **Given** a job has failed
   **When** I view the failure
   **Then** I can manually retry the job or adjust its configuration

---

### Feature 13.4: Email Service Management

#### User Story 13.4.1: Send Emails via Email Service
**As a** system
**I want** to send emails via Scaleway email service
**So that** emails are delivered reliably

**Acceptance Criteria:**

1. **Given** an email needs to be sent
   **When** the email job executes
   **Then** the ScalewayEmailService sends the email via Scaleway API

2. **Given** an email is sent
   **When** Scaleway confirms delivery
   **Then** the email status is logged as sent

3. **Given** email sending fails
   **When** Scaleway returns an error
   **Then** the error is logged and the job retries

#### User Story 13.4.2: Use Email Templates
**As a** system
**I want** to use HTML email templates
**So that** emails are well-formatted and professional

**Acceptance Criteria:**

1. **Given** an email needs to be sent
   **When** the template is loaded
   **Then** the EmailTemplateService loads the appropriate HTML template

2. **Given** a template is loaded
   **When** personalization is needed
   **Then** placeholders are replaced with actual user data (name, property, amounts)

3. **Given** an email is rendered
   **When** it is sent
   **Then** the HTML is properly formatted and responsive for mobile devices

---

## Appendix

### Roles & Permissions Summary

**Admin:**
- Full access to all features
- User management and role assignment
- Access to admin-only controllers (DataRetention, LegalHold)
- Hangfire dashboard access

**PropertyOwner:**
- Create, read, update, delete own properties
- Invite and manage tenants for own properties
- Record and view payments for own properties
- Upload and view contracts for own tenants
- View maintenance requests for own properties
- Access financial reports and dashboard
- Manage Stripe Connect account

**Renter (Tenant):**
- View own tenant information and lease details
- View own payment history
- Make online rent payments
- Submit and track maintenance requests
- View own contracts
- Access tenant dashboard

### Data Models Reference

**Key Entities:**
- User: Authentication and authorization
- Person: Personal information for individuals
- Company: Company information for corporate tenants
- Property: Rental properties
- Tenant: Tenant records (linked to Person or Company)
- Payment: Payment transactions
- Contract: Lease agreements
- MaintenanceRequest: Maintenance issues
- TenantInvitation: Tenant onboarding invitations
- StripeConnectAccount: Stripe payment integration
- DataSubjectRequest: GDPR/privacy requests
- CookieConsent: Cookie preferences
- PrivacyPolicyVersion: Privacy policy versions
- UserPrivacyPolicyAcceptance: Policy acceptance records

### Status Enums Reference

**TenantStatus:** Active, Inactive, Pending
**PaymentStatus:** Completed, Pending, Failed, Cancelled, Processing, Refunded
**PaymentMethod:** Cash, Check, BankTransfer, CreditCard, Online, DebitCard, MobilePay, CardOnline
**ContractStatus:** Draft, Pending, Signed, Terminated
**MaintenanceStatus:** Pending, InProgress, Completed, Cancelled
**MaintenancePriority:** Low, Medium, High, Emergency
**InvitationStatus:** Pending, Accepted, Expired, Cancelled
**StripeAccountStatus:** PendingOnboarding, OnboardingStarted, OnboardingIncomplete, Active, Restricted, Disabled, Rejected
**DataSubjectRequestType:** Access, Deletion, Portability, Rectification, Restriction, Objection, RetentionInquiry
**DataSubjectRequestStatus:** Pending, InProgress, Completed, Rejected

---

**End of Document**
