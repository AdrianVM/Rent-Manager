# Stripe Connect Implementation Guide for Rent Manager
## Comprehensive Solution for Private Property Owner Payments

---

## Executive Summary

This implementation enables **private individuals** (non-business property owners) to legally collect rent payments via credit/debit cards through your Rent Manager platform using **Stripe Connect Express Accounts**.

### Key Benefits:
- Private individuals can accept card payments without registering as a business
- Platform retains control and charges transparent fees
- Stripe handles KYC/AML compliance and tax documentation
- Automatic fund distribution: Tenant → Platform → Property Owner
- Full audit trail for all transactions

### Architecture: Platform-Facilitated Payments with Destination Charges

```
┌─────────┐       ┌──────────────┐       ┌────────────────┐
│ Tenant  │──────▶│   Platform   │──────▶│ Property Owner │
│ (Payer) │       │ (Your Stripe │       │ (Connect Acct) │
└─────────┘       │   Account)   │       └────────────────┘
                  └──────────────┘
   Pays Full         ├─ Platform Fee
   Amount            └─ Transfer Remainder
```

---

## 1. ARCHITECTURAL OVERVIEW

### 1.1 Account Structure

| Entity | Stripe Account Type | Purpose |
|--------|-------------------|---------|
| **Rent Manager Platform** | Standard Account | Master account that collects all payments |
| **Individual Property Owner** | Express Account | Receives rent transfers, simplified onboarding |
| **Company Property Owner** | Express/Standard Account | Business owner account |
| **Tenant** | Stripe Customer | Payer (no account needed) |

### 1.2 Payment Flow

**Step-by-Step Flow:**

1. **Tenant** initiates rent payment on platform
2. **Platform** creates Payment Intent with `application_fee_amount` and `transfer_data`
3. **Stripe** charges tenant's card
4. **Platform** automatically receives full amount
5. **Platform** retains `application_fee_amount` (platform fee)
6. **Stripe** automatically transfers remainder to property owner's Connected Account
7. **Property Owner** can request payout to their bank account

**Money Flow:**
```
Tenant pays 1000 RON
  ├─ Stripe fee: ~30 RON (deducted from platform)
  ├─ Platform fee: 35 RON (retained by platform)
  └─ Property owner receives: 965 RON (transferred automatically)
```

### 1.3 Fee Structure

**Default Platform Fees (Configurable):**
- Percentage: 3% + 0.50 RON fixed per transaction
- Can vary by:
  - Property owner type (Individual vs Company)
  - Payment amount
  - Promotional periods
  - Specific properties

**Stripe Fees (Romania):**
- Card payments: 2.9% + 1.00 RON
- Charged to platform account
- Deducted from platform's balance

---

## 2. DATABASE SCHEMA

### 2.1 New Tables

#### StripeConnectAccounts
```sql
CREATE TABLE StripeConnectAccounts (
    Id VARCHAR(36) PRIMARY KEY,
    PropertyOwnerId VARCHAR(36) NOT NULL,
    StripeAccountId VARCHAR(100) NOT NULL UNIQUE, -- acc_xxxxx
    AccountType VARCHAR(20) NOT NULL, -- Express, Standard
    Status VARCHAR(30) NOT NULL, -- PendingOnboarding, Active, etc.

    -- Onboarding
    OnboardingCompleted BOOLEAN DEFAULT FALSE,
    OnboardingCompletedAt TIMESTAMP NULL,
    OnboardingUrl TEXT NULL,
    OnboardingUrlExpiresAt TIMESTAMP NULL,

    -- Capabilities
    CanAcceptPayments BOOLEAN DEFAULT FALSE,
    CanCreatePayouts BOOLEAN DEFAULT FALSE,
    DisabledReason TEXT NULL,

    -- Verification
    IdentityVerified BOOLEAN DEFAULT FALSE,
    DocumentsRequired BOOLEAN DEFAULT FALSE,
    RequiredDocuments TEXT NULL, -- JSON array
    VerifiedAt TIMESTAMP NULL,

    -- Payout configuration
    Currency VARCHAR(3) DEFAULT 'ron',
    DefaultPayoutSchedule VARCHAR(20) DEFAULT 'manual',
    InstantPayoutsEnabled BOOLEAN DEFAULT FALSE,

    -- Bank details (last 4 only)
    BankAccountLast4 VARCHAR(4) NULL,
    BankName VARCHAR(100) NULL,
    BankCountry VARCHAR(2) NULL,

    -- Metadata
    StripeEmail VARCHAR(255) NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    DeactivationReason TEXT NULL,
    DeactivatedAt TIMESTAMP NULL,
    Metadata TEXT NULL, -- JSON

    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (PropertyOwnerId) REFERENCES PropertyOwners(Id)
);

CREATE INDEX idx_stripe_connect_property_owner ON StripeConnectAccounts(PropertyOwnerId);
CREATE INDEX idx_stripe_connect_stripe_account ON StripeConnectAccounts(StripeAccountId);
```

#### StripeTransfers
```sql
CREATE TABLE StripeTransfers (
    Id VARCHAR(36) PRIMARY KEY,
    PaymentId VARCHAR(36) NOT NULL,
    StripeConnectAccountId VARCHAR(36) NOT NULL,

    -- Stripe IDs
    StripeTransferId VARCHAR(100) NOT NULL,
    StripePaymentIntentId VARCHAR(100) NOT NULL,

    -- Amounts (in RON)
    GrossAmount DECIMAL(10, 2) NOT NULL,
    PlatformFee DECIMAL(10, 2) NOT NULL,
    StripeFee DECIMAL(10, 2) NOT NULL,
    NetAmount DECIMAL(10, 2) NOT NULL,

    -- Status
    Status VARCHAR(20) NOT NULL, -- Pending, InTransit, Completed, Failed, Reversed
    FailureReason TEXT NULL,
    FailureCode VARCHAR(50) NULL,

    -- Timing
    TransferredAt TIMESTAMP NULL,
    ExpectedArrivalDate TIMESTAMP NULL,
    ActualArrivalDate TIMESTAMP NULL,

    -- Payout tracking
    StripePayoutId VARCHAR(100) NULL,
    PayoutCompleted BOOLEAN DEFAULT FALSE,
    PayoutCompletedAt TIMESTAMP NULL,

    -- Reversal (refund scenario)
    IsReversed BOOLEAN DEFAULT FALSE,
    ReversalId VARCHAR(100) NULL,
    ReversedAt TIMESTAMP NULL,
    ReversalReason TEXT NULL,

    -- Metadata
    Description TEXT NULL,
    Metadata TEXT NULL, -- JSON
    IdempotencyKey VARCHAR(100) UNIQUE NOT NULL,

    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (PaymentId) REFERENCES Payments(Id),
    FOREIGN KEY (StripeConnectAccountId) REFERENCES StripeConnectAccounts(Id)
);

CREATE INDEX idx_stripe_transfers_payment ON StripeTransfers(PaymentId);
CREATE INDEX idx_stripe_transfers_connect_account ON StripeTransfers(StripeConnectAccountId);
CREATE INDEX idx_stripe_transfers_stripe_transfer ON StripeTransfers(StripeTransferId);
```

#### StripePlatformFees
```sql
CREATE TABLE StripePlatformFees (
    Id VARCHAR(36) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    IsDefault BOOLEAN DEFAULT FALSE,

    -- Fee structure
    FeeType VARCHAR(20) NOT NULL, -- Percentage, Fixed, Hybrid
    PercentageFee DECIMAL(5, 2) DEFAULT 0, -- e.g., 3.50 for 3.5%
    FixedFee DECIMAL(10, 2) DEFAULT 0, -- e.g., 5.00 RON
    MinimumFee DECIMAL(10, 2) DEFAULT 0,
    MaximumFee DECIMAL(10, 2) DEFAULT 0,

    -- Applicability
    ApplicableToOwnerType VARCHAR(20) NULL, -- "Person", "Company", or NULL for all
    MinPaymentAmount DECIMAL(10, 2) NULL,
    MaxPaymentAmount DECIMAL(10, 2) NULL,
    PropertyId VARCHAR(36) NULL, -- Property-specific fee

    -- Temporal validity
    ValidFrom TIMESTAMP NULL,
    ValidTo TIMESTAMP NULL,

    -- Promotional
    IsPromotional BOOLEAN DEFAULT FALSE,
    FreePaymentsCount INT NULL, -- First N payments free

    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (PropertyId) REFERENCES Properties(Id)
);

CREATE INDEX idx_platform_fees_active ON StripePlatformFees(IsActive, IsDefault);
CREATE INDEX idx_platform_fees_property ON StripePlatformFees(PropertyId);
```

### 2.2 Update Existing Tables

#### Payments Table - Add Columns
```sql
ALTER TABLE Payments ADD COLUMN StripeConnectAccountId VARCHAR(36) NULL;
ALTER TABLE Payments ADD COLUMN PlatformFee DECIMAL(10, 2) NULL;
ALTER TABLE Payments ADD COLUMN TransferAmount DECIMAL(10, 2) NULL;
ALTER TABLE Payments ADD COLUMN StripeTransferId VARCHAR(36) NULL;
ALTER TABLE Payments ADD COLUMN TransferCompleted BOOLEAN DEFAULT FALSE;
ALTER TABLE Payments ADD COLUMN TransferredAt TIMESTAMP NULL;

ALTER TABLE Payments ADD CONSTRAINT fk_payment_stripe_connect
    FOREIGN KEY (StripeConnectAccountId) REFERENCES StripeConnectAccounts(Id);
```

#### PropertyOwners Table - Add Relationship
```sql
-- Already has relationship via StripeConnectAccounts.PropertyOwnerId
-- No changes needed
```

---

## 3. IMPLEMENTATION STEPS

### 3.1 Setup Stripe Connect in Stripe Dashboard

1. **Create Stripe Account** (if not already done)
   - Go to https://dashboard.stripe.com
   - Complete business verification

2. **Enable Connect**
   - Navigate to: Settings → Connect → Get Started
   - Choose "Platform or marketplace" business type
   - Complete platform profile

3. **Configure Connect Settings**
   - Branding: Upload logo, set colors
   - Account types: Enable "Express" accounts
   - Supported countries: Romania (and others as needed)

4. **Get API Keys**
   - Navigate to: Developers → API Keys
   - Copy **Secret Key** and **Publishable Key**
   - Store securely in appsettings.json

5. **Create Webhook Endpoint**
   - Navigate to: Developers → Webhooks → Add endpoint
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
     - `account.updated`
     - `account.external_account.created`
     - `account.external_account.updated`
     - `transfer.created`
     - `transfer.reversed`
     - `payout.paid`
     - `payout.failed`
     - `charge.refunded`
   - Copy **Webhook Secret** (whsec_xxxxx)

### 3.2 Backend Configuration

#### appsettings.json
```json
{
  "Stripe": {
    "SecretKey": "sk_test_xxxxx", // Use sk_live_xxxxx in production
    "PublishableKey": "pk_test_xxxxx",
    "WebhookSecret": "whsec_xxxxx",
    "Currency": "ron",
    "EnableTestMode": true
  },
  "FrontendUrl": "https://your-frontend-domain.com"
}
```

#### Program.cs - Register Services
```csharp
// Add Stripe settings
builder.Services.Configure<StripeSettings>(
    builder.Configuration.GetSection("Stripe"));

// Register Stripe Connect services
builder.Services.AddScoped<IStripeConnectService, StripeConnectService>();
builder.Services.AddScoped<StripeConnectPaymentService>();

// Existing payment gateway
builder.Services.AddScoped<IPaymentGateway, StripePaymentGateway>();
```

### 3.3 Database Migration

```bash
# Create migration
dotnet ef migrations add AddStripeConnectTables -p RentManager.API

# Apply migration
dotnet ef database update -p RentManager.API
```

### 3.4 Seed Default Platform Fee

```csharp
// In your data seeding code
var defaultFee = new StripePlatformFee
{
    Id = Guid.NewGuid().ToString(),
    Name = "Default Platform Fee",
    Description = "Standard platform fee for all payments",
    IsActive = true,
    IsDefault = true,
    FeeType = PlatformFeeType.Hybrid,
    PercentageFee = 3.0m, // 3%
    FixedFee = 0.50m, // 0.50 RON
    MinimumFee = 5.00m, // Minimum 5 RON
    MaximumFee = 100.00m, // Maximum 100 RON
    CreatedAt = DateTimeOffset.UtcNow,
    UpdatedAt = DateTimeOffset.UtcNow
};

context.Set<StripePlatformFee>().Add(defaultFee);
await context.SaveChangesAsync();
```

---

## 4. API ENDPOINTS

### 4.1 Property Owner Onboarding

#### Create Connect Account
```http
POST /api/stripe-connect/accounts
Authorization: Bearer {token}
Content-Type: application/json

{
  "propertyOwnerId": "property-owner-id-here",
  "accountType": "Express",
  "email": "owner@example.com"
}

Response 201:
{
  "id": "connect-account-id",
  "stripeAccountId": "acct_xxxxx",
  "status": "PendingOnboarding",
  "onboardingUrl": null
}
```

#### Generate Onboarding Link
```http
POST /api/stripe-connect/accounts/{accountId}/onboarding-link
Authorization: Bearer {token}
Content-Type: application/json

{
  "refreshUrl": "https://your-app.com/onboarding/refresh",
  "returnUrl": "https://your-app.com/onboarding/complete"
}

Response 200:
{
  "url": "https://connect.stripe.com/setup/c/xxxxx",
  "expiresAt": "2025-11-17T15:30:00Z"
}
```

#### Check Onboarding Status
```http
GET /api/stripe-connect/accounts/{accountId}/status
Authorization: Bearer {token}

Response 200:
{
  "id": "connect-account-id",
  "status": "Active",
  "canAcceptPayments": true,
  "canCreatePayouts": true,
  "onboardingCompleted": true,
  "identityVerified": true,
  "bankAccountLast4": "1234",
  "bankName": "Banca Transilvania"
}
```

### 4.2 Payment Processing

#### Create Payment with Connect
```http
POST /api/payments/connect
Authorization: Bearer {token}
Content-Type: application/json

{
  "tenantId": "tenant-id",
  "amount": 1000.00,
  "propertyOwnerId": "property-owner-id",
  "method": "CardOnline",
  "notes": "November 2025 rent"
}

Response 201:
{
  "paymentId": "payment-id",
  "clientSecret": "pi_xxxxx_secret_xxxxx",
  "platformFee": 30.50,
  "transferAmount": 969.50,
  "stripeAccountId": "acct_xxxxx",
  "feeCalculation": "Platform fee: 3% + 0.50 RON = 30.50 RON"
}
```

#### Get Payment Fee Estimate
```http
POST /api/payments/estimate-fee
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 1000.00,
  "propertyOwnerId": "property-owner-id"
}

Response 200:
{
  "grossAmount": 1000.00,
  "platformFee": 30.50,
  "stripeFee": 30.00,
  "netAmount": 969.50,
  "calculation": "Platform fee: 3% + 0.50 RON = 30.50 RON"
}
```

### 4.3 Transfer Management

#### List Transfers for Payment
```http
GET /api/payments/{paymentId}/transfers
Authorization: Bearer {token}

Response 200:
{
  "transfers": [
    {
      "id": "transfer-id",
      "stripeTransferId": "tr_xxxxx",
      "grossAmount": 1000.00,
      "platformFee": 30.50,
      "stripeFee": 30.00,
      "netAmount": 969.50,
      "status": "Completed",
      "transferredAt": "2025-11-17T14:30:00Z",
      "payoutCompleted": true
    }
  ]
}
```

#### List Transfers for Property Owner
```http
GET /api/stripe-connect/accounts/{accountId}/transfers
Authorization: Bearer {token}

Response 200:
{
  "transfers": [...],
  "totalNetAmount": 5837.50,
  "pendingPayouts": 969.50
}
```

### 4.4 Payout Management

#### Create Manual Payout
```http
POST /api/stripe-connect/accounts/{accountId}/payouts
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 969.50,
  "description": "Rent payment payout"
}

Response 201:
{
  "payoutId": "po_xxxxx",
  "amount": 969.50,
  "status": "in_transit",
  "arrivalDate": "2025-11-19T00:00:00Z",
  "bankAccountLast4": "1234"
}
```

#### List Payouts
```http
GET /api/stripe-connect/accounts/{accountId}/payouts
Authorization: Bearer {token}

Response 200:
{
  "payouts": [
    {
      "payoutId": "po_xxxxx",
      "amount": 969.50,
      "status": "paid",
      "arrivalDate": "2025-11-19T00:00:00Z",
      "createdAt": "2025-11-17T14:30:00Z"
    }
  ]
}
```

### 4.5 Account Management

#### Get Account Balance
```http
GET /api/stripe-connect/accounts/{accountId}/balance
Authorization: Bearer {token}

Response 200:
{
  "available": 969.50,
  "pending": 2000.00,
  "currency": "ron"
}
```

#### Generate Dashboard Login Link
```http
POST /api/stripe-connect/accounts/{accountId}/login-link
Authorization: Bearer {token}

Response 200:
{
  "url": "https://connect.stripe.com/express/xxxxx"
}
```

---

## 5. FRONTEND IMPLEMENTATION

### 5.1 Property Owner Onboarding Flow

#### Step 1: Check if Connected Account Exists
```typescript
const checkConnectAccount = async (propertyOwnerId: string) => {
  const response = await fetch(`/api/stripe-connect/property-owners/${propertyOwnerId}/account`);

  if (response.status === 404) {
    return null; // No account, needs onboarding
  }

  const account = await response.json();
  return account;
};
```

#### Step 2: Create Connect Account
```typescript
const createConnectAccount = async (propertyOwnerId: string, email: string) => {
  const response = await fetch('/api/stripe-connect/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyOwnerId,
      accountType: 'Express',
      email
    })
  });

  return await response.json();
};
```

#### Step 3: Generate and Redirect to Onboarding
```typescript
const startOnboarding = async (accountId: string) => {
  const response = await fetch(`/api/stripe-connect/accounts/${accountId}/onboarding-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshUrl: `${window.location.origin}/onboarding/refresh`,
      returnUrl: `${window.location.origin}/onboarding/complete`
    })
  });

  const { url } = await response.json();

  // Redirect to Stripe onboarding
  window.location.href = url;
};
```

#### Step 4: Handle Return from Onboarding
```typescript
// On /onboarding/complete page
const completeOnboarding = async () => {
  const accountId = localStorage.getItem('stripe_connect_account_id');

  // Refresh account status
  const response = await fetch(`/api/stripe-connect/accounts/${accountId}/refresh`, {
    method: 'POST'
  });

  const account = await response.json();

  if (account.canAcceptPayments) {
    // Success! Show success message
    showSuccessMessage('Your account is ready to accept payments!');
  } else {
    // Still need more information
    showWarningMessage('Additional information required. Please complete verification.');
  }
};
```

### 5.2 Payment Processing with Stripe Connect

#### Initialize Stripe.js
```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_xxxxx');
```

#### Create Payment Intent
```typescript
const createPaymentIntent = async (tenantId: string, amount: number, propertyOwnerId: string) => {
  const response = await fetch('/api/payments/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId,
      amount,
      propertyOwnerId,
      method: 'CardOnline'
    })
  });

  return await response.json();
};
```

#### Process Payment with Stripe Elements
```typescript
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PaymentForm = ({ clientSecret, amount, platformFee, transferAmount }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payments/complete`,
      },
    });

    if (error) {
      showError(error.message);
    } else if (paymentIntent.status === 'succeeded') {
      showSuccess('Payment successful!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="payment-details">
        <p>Payment Amount: {amount} RON</p>
        <p>Platform Fee: {platformFee} RON</p>
        <p>Landlord Receives: {transferAmount} RON</p>
      </div>

      <PaymentElement />

      <button type="submit" disabled={!stripe}>
        Pay {amount} RON
      </button>
    </form>
  );
};

// In parent component
const CheckoutPage = () => {
  const [clientSecret, setClientSecret] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    // Create payment intent on mount
    createPaymentIntent(tenantId, amount, propertyOwnerId)
      .then(data => {
        setClientSecret(data.clientSecret);
        setPaymentDetails(data);
      });
  }, []);

  const options = { clientSecret };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...paymentDetails} />
    </Elements>
  );
};
```

### 5.3 Property Owner Dashboard

#### Display Connect Account Status
```typescript
const ConnectAccountStatus = ({ propertyOwnerId }) => {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    fetchAccountStatus();
  }, [propertyOwnerId]);

  const fetchAccountStatus = async () => {
    const response = await fetch(`/api/stripe-connect/property-owners/${propertyOwnerId}/account`);
    if (response.ok) {
      setAccount(await response.json());
    }
  };

  const openStripeDashboard = async () => {
    const response = await fetch(`/api/stripe-connect/accounts/${account.id}/login-link`, {
      method: 'POST'
    });
    const { url } = await response.json();
    window.open(url, '_blank');
  };

  if (!account) {
    return (
      <div className="connect-setup">
        <h3>Accept Card Payments</h3>
        <p>Complete your Stripe setup to receive rent payments directly to your bank account.</p>
        <button onClick={() => startOnboarding()}>
          Setup Payment Account
        </button>
      </div>
    );
  }

  return (
    <div className="connect-status">
      <h3>Payment Account</h3>

      <div className="status-badge">
        {account.status === 'Active' ? (
          <span className="badge-success">Active</span>
        ) : (
          <span className="badge-warning">{account.status}</span>
        )}
      </div>

      <div className="account-details">
        <p>Can Accept Payments: {account.canAcceptPayments ? 'Yes' : 'No'}</p>
        <p>Bank Account: •••• {account.bankAccountLast4}</p>
        <p>Bank: {account.bankName}</p>
      </div>

      <button onClick={openStripeDashboard}>
        View Stripe Dashboard
      </button>
    </div>
  );
};
```

#### Display Transfers and Payouts
```typescript
const TransfersTable = ({ accountId }) => {
  const [transfers, setTransfers] = useState([]);

  useEffect(() => {
    fetchTransfers();
  }, [accountId]);

  const fetchTransfers = async () => {
    const response = await fetch(`/api/stripe-connect/accounts/${accountId}/transfers`);
    const data = await response.json();
    setTransfers(data.transfers);
  };

  return (
    <table className="transfers-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Payment</th>
          <th>Gross Amount</th>
          <th>Platform Fee</th>
          <th>Net Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {transfers.map(transfer => (
          <tr key={transfer.id}>
            <td>{new Date(transfer.transferredAt).toLocaleDateString()}</td>
            <td>{transfer.description}</td>
            <td>{transfer.grossAmount} RON</td>
            <td>{transfer.platformFee} RON</td>
            <td>{transfer.netAmount} RON</td>
            <td>
              <span className={`status-${transfer.status.toLowerCase()}`}>
                {transfer.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

## 6. WEBHOOK HANDLING

### 6.1 Webhook Security

The existing webhook controller at `/home/adrian/IT Projects/Rent-Manager/backend/RentManager.API/Controllers/StripeWebhookController.cs` needs to be enhanced to handle Connect events.

**Critical Security Points:**
1. Webhook signature verification (already implemented)
2. Idempotency handling (prevent duplicate processing)
3. Async event processing (don't block webhook response)
4. Proper error handling (return 200 even on errors to prevent retries)

### 6.2 Key Webhook Events to Handle

#### payment_intent.succeeded
- Update Payment status to Completed
- Extract Stripe fees
- Create StripeTransfer record
- Update property owner balance

#### account.updated
- Refresh ConnectAccount status
- Update capabilities (charges_enabled, payouts_enabled)
- Check verification status

#### transfer.created
- Log transfer creation
- Track transfer status

#### transfer.reversed
- Mark transfer as reversed
- Handle refund scenario

#### payout.paid
- Update transfer records
- Mark as payout completed

#### payout.failed
- Mark transfers as failed
- Log failure reason
- Notify property owner

### 6.3 Webhook Testing

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to http://localhost:5000/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger account.updated
stripe trigger payout.paid
```

---

## 7. TESTING STRATEGY

### 7.1 Unit Tests

```csharp
[Fact]
public async Task CreateConnectAccount_ShouldCreateExpressAccount()
{
    // Arrange
    var propertyOwnerId = "test-owner-id";
    var email = "owner@test.com";

    // Act
    var account = await _stripeConnectService.CreateConnectAccountAsync(
        propertyOwnerId,
        StripeAccountType.Express,
        email);

    // Assert
    Assert.NotNull(account);
    Assert.Equal(StripeAccountStatus.PendingOnboarding, account.Status);
    Assert.False(account.CanAcceptPayments);
}

[Fact]
public async Task CalculatePlatformFee_ShouldApplyDefaultFee()
{
    // Arrange
    var amount = 1000m;
    var propertyOwnerId = "test-owner-id";

    // Act
    var result = await _paymentService.CalculatePlatformFeeAsync(
        amount,
        propertyOwnerId);

    // Assert
    Assert.Equal(30.50m, result.PlatformFee); // 3% + 0.50 = 30.50
    Assert.Equal(969.50m, result.NetAmount);
}
```

### 7.2 Integration Tests

```csharp
[Fact]
public async Task CreatePaymentIntent_WithConnect_ShouldIncludeTransferData()
{
    // Arrange
    var payment = CreateTestPayment(1000m);
    var tenant = CreateTestTenant();
    var propertyOwner = CreateTestPropertyOwner();

    // Create connect account first
    var connectAccount = await CreateTestConnectAccount(propertyOwner.Id);

    // Act
    var response = await _connectPaymentService.CreateConnectPaymentIntentAsync(
        payment,
        tenant,
        propertyOwner.Id,
        30.50m);

    // Assert
    Assert.True(response.Success);
    Assert.NotNull(response.ClientSecret);
    Assert.Contains("platform_fee", response.Metadata.Keys);
}
```

### 7.3 End-to-End Testing Checklist

- [ ] Property owner onboarding flow
  - [ ] Create account
  - [ ] Generate onboarding link
  - [ ] Complete onboarding in Stripe UI
  - [ ] Verify account status updates

- [ ] Payment processing
  - [ ] Create payment intent with fee
  - [ ] Complete payment with test card
  - [ ] Verify webhook received
  - [ ] Confirm transfer created
  - [ ] Check property owner balance

- [ ] Refund flow
  - [ ] Issue refund
  - [ ] Verify transfer reversal
  - [ ] Confirm platform fee refunded

- [ ] Payout flow
  - [ ] Request manual payout
  - [ ] Verify payout status
  - [ ] Confirm arrival date

### 7.4 Test Cards (Stripe Test Mode)

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0025 0000 3155 | Requires 3DS authentication |
| 4000 0000 0000 9995 | Declined (insufficient funds) |
| 4000 0000 0000 0002 | Declined (generic decline) |

---

## 8. COMPLIANCE & SECURITY

### 8.1 PCI Compliance

You are **PCI-DSS SAQ A compliant** because:
- You never handle card data directly
- Stripe.js collects card details on client-side
- Card data goes directly to Stripe servers
- You only store Stripe IDs (payment_intent_id, customer_id)

**Requirements:**
- Use Stripe.js or Stripe Elements (not raw card inputs)
- Serve your site over HTTPS
- Don't log card numbers, CVV, or full PANs
- Store only last 4 digits for display purposes

### 8.2 Data Retention

**What to Store:**
- Payment IDs, transaction IDs
- Transfer records
- Platform fee calculations
- Metadata (amounts, dates, statuses)

**What NOT to Store:**
- Full card numbers
- CVV codes
- Card expiration dates (unless from Stripe objects)
- Raw authentication tokens

### 8.3 KYC/AML Compliance

Stripe handles KYC/AML for connected accounts:
- Identity verification (ID document upload)
- Address verification
- Bank account verification
- Business verification (for companies)
- Ongoing monitoring

**Your Responsibilities:**
- Verify property owner is legitimate
- Monitor for suspicious activity
- Report violations to Stripe
- Maintain records for 7 years (financial regulations)

### 8.4 Tax Compliance

**1099 Forms (US) / Tax Documents (International):**
- Stripe automatically generates 1099-K forms for US property owners earning >$600/year
- For Romanian property owners, transfers are reported to tax authorities
- Property owners are responsible for reporting rental income

**Platform Reporting:**
- Provide annual statements to property owners
- Include: gross payments, platform fees, net transfers
- Document all fees and transfers for audit purposes

### 8.5 GDPR Compliance

**Data Controller Responsibilities:**
- Maintain privacy policy explaining payment processing
- Get consent for payment processing
- Allow users to download their payment data
- Implement data retention policies
- Handle data deletion requests

**Stripe as Data Processor:**
- Stripe is your data processor
- Have Data Processing Agreement with Stripe (automatic with terms of service)
- Stripe handles card data securely

---

## 9. MONITORING & OPERATIONS

### 9.1 Monitoring Checklist

**Key Metrics to Track:**
- [ ] Payment success rate
- [ ] Payment failure rate by reason
- [ ] Average platform fee collected
- [ ] Transfer completion rate
- [ ] Payout success rate
- [ ] Connected accounts onboarding completion rate
- [ ] Webhook processing latency
- [ ] API error rates

### 9.2 Alerting

**Critical Alerts:**
- Webhook signature verification failures
- High payment failure rate (>10%)
- Transfer failures
- Payout failures
- Connect account disabled
- API errors (500s)

**Warning Alerts:**
- Webhook processing delays
- Increased declined payments
- Accounts stuck in onboarding
- Balance discrepancies

### 9.3 Logging Best Practices

```csharp
// Good: Log operations with context
_logger.LogInformation(
    "Payment {PaymentId} processed successfully. Amount: {Amount}, " +
    "Platform Fee: {PlatformFee}, Transfer: {TransferAmount}",
    payment.Id, payment.Amount, platformFee, transferAmount);

// Bad: Don't log sensitive data
_logger.LogInformation($"Card number: {cardNumber}"); // NEVER DO THIS
_logger.LogInformation($"CVV: {cvv}"); // NEVER DO THIS
```

### 9.4 Operational Procedures

**Daily:**
- Check webhook event logs
- Monitor payment success rates
- Review failed transfers

**Weekly:**
- Reconcile platform fees
- Review payout statuses
- Check for stuck onboardings

**Monthly:**
- Generate financial reports
- Reconcile Stripe balance with database
- Audit failed payments

---

## 10. TROUBLESHOOTING

### 10.1 Common Issues

#### Property Owner Cannot Complete Onboarding

**Symptoms:**
- Onboarding link expired
- Account stuck in "OnboardingIncomplete"

**Solutions:**
```csharp
// Generate a new onboarding link
var newLink = await _connectService.GenerateOnboardingLinkAsync(
    accountId,
    refreshUrl,
    returnUrl);

// Refresh account status
await _connectService.RefreshAccountStatusAsync(accountId);
```

#### Payment Fails with "Account not found"

**Cause:** Connected account doesn't exist or isn't active

**Solution:**
```csharp
// Check if account can accept payments
var canAccept = await _connectService.CanAcceptPaymentsAsync(propertyOwnerId);
if (!canAccept) {
    throw new InvalidOperationException(
        "Property owner must complete Stripe onboarding before accepting payments");
}
```

#### Transfer Not Created After Payment

**Cause:** Webhook not received or processed

**Solutions:**
1. Check webhook logs in Stripe Dashboard
2. Manually trigger webhook event
3. Process payment manually:
```csharp
var paymentIntent = await paymentIntentService.GetAsync(paymentIntentId);
await _connectPaymentService.HandlePaymentSuccessWebhookAsync(paymentIntent);
```

#### Platform Fee Calculation Incorrect

**Cause:** Multiple fee structures or misconfiguration

**Solution:**
```csharp
// Debug fee calculation
var feeResult = await _connectPaymentService.CalculatePlatformFeeAsync(
    amount,
    propertyOwnerId,
    propertyId);

_logger.LogInformation(
    "Fee calculation: {Calculation}, Structure: {StructureName}",
    feeResult.Calculation,
    feeResult.FeeStructureName);
```

### 10.2 Debugging Webhooks

```bash
# View recent webhook events
stripe events list --limit 10

# Resend specific webhook
stripe events resend evt_xxxxx

# Test webhook locally
stripe trigger payment_intent.succeeded
```

### 10.3 Reconciliation Script

```csharp
public async Task<ReconciliationReport> ReconcilePayments(DateTimeOffset from, DateTimeOffset to)
{
    // Get payments from database
    var dbPayments = await _context.Payments
        .Where(p => p.ProcessedAt >= from && p.ProcessedAt <= to)
        .Where(p => p.Status == PaymentStatus.Completed)
        .ToListAsync();

    // Get transfers from database
    var dbTransfers = await _context.Set<StripeTransfer>()
        .Where(t => t.TransferredAt >= from && t.TransferredAt <= to)
        .ToListAsync();

    // Calculate totals
    var totalPayments = dbPayments.Sum(p => p.Amount);
    var totalPlatformFees = dbPayments.Sum(p => p.PlatformFee ?? 0);
    var totalTransfers = dbTransfers.Sum(t => t.NetAmount);

    // Validate
    var expectedTransfers = totalPayments - totalPlatformFees;
    var discrepancy = Math.Abs(expectedTransfers - totalTransfers);

    return new ReconciliationReport
    {
        TotalPayments = totalPayments,
        TotalPlatformFees = totalPlatformFees,
        TotalTransfers = totalTransfers,
        ExpectedTransfers = expectedTransfers,
        Discrepancy = discrepancy,
        IsBalanced = discrepancy < 0.01m // Allow 1 cent rounding
    };
}
```

---

## 11. COST ANALYSIS

### 11.1 Stripe Fees (Romania)

**Card Payments:**
- European cards: 1.5% + 0.25 EUR
- Non-European cards: 2.9% + 0.25 EUR
- Romanian cards (with Romanian-issued card): 2.9% + 1.00 RON

**Connect Fees:**
- No additional fees for Express accounts
- Platform retains application fee (you set this)

**Example Calculation for 1000 RON rent:**
```
Tenant pays: 1000 RON
Stripe fee (2.9% + 1 RON): ~30 RON (charged to platform)
Platform fee (3% + 0.50 RON): 30.50 RON (retained by you)
Property owner receives: 969.50 RON

Your net: 30.50 RON (platform fee) - 30 RON (Stripe fee) = 0.50 RON
```

### 11.2 Pricing Recommendations

**Strategy 1: Pass Stripe fees to tenants**
- Tenant pays: 1030.50 RON (rent + Stripe fee + platform fee)
- Platform retains: 30.50 RON
- Property owner receives: 1000 RON

**Strategy 2: Absorb Stripe fees, charge platform fee**
- Tenant pays: 1000 RON
- Platform retains: 30.50 RON
- Stripe charges: ~30 RON
- Property owner receives: ~969.50 RON
- Your net: ~0.50 RON

**Strategy 3: Percentage-only fee**
- Platform fee: 5% of rent
- Tenant pays: 1000 RON
- Platform retains: 50 RON
- Stripe charges: ~30 RON
- Property owner receives: 950 RON
- Your net: 20 RON

**Recommended:** Strategy 1 or 3 for sustainability

---

## 12. GO-LIVE CHECKLIST

### Pre-Launch

- [ ] Stripe account verified and approved
- [ ] Live API keys obtained and stored securely
- [ ] Webhook endpoint configured with live webhook secret
- [ ] SSL certificate installed (HTTPS required)
- [ ] Database schema migrated to production
- [ ] Default platform fee structure configured
- [ ] Testing completed with test mode
- [ ] Privacy policy updated with payment processing details
- [ ] Terms of service include payment terms
- [ ] Support documentation created

### Launch Day

- [ ] Switch from test to live API keys
- [ ] Update Stripe webhook endpoint to production URL
- [ ] Test one end-to-end transaction with real card
- [ ] Monitor webhook event logs
- [ ] Set up alerting for critical errors
- [ ] Prepare rollback plan

### Post-Launch

- [ ] Monitor first 100 transactions closely
- [ ] Verify all transfers complete successfully
- [ ] Check property owner payouts work
- [ ] Collect user feedback
- [ ] Monitor support requests
- [ ] Review financial reconciliation daily for first week

---

## 13. SUPPORT & RESOURCES

### Stripe Resources

- **Documentation:** https://stripe.com/docs/connect
- **Connect Express Guide:** https://stripe.com/docs/connect/express-accounts
- **Destination Charges:** https://stripe.com/docs/connect/destination-charges
- **API Reference:** https://stripe.com/docs/api/transfers
- **Support:** https://support.stripe.com

### Common Support Scenarios

**Property Owner Needs Help:**
1. Direct them to Stripe Express Dashboard (via login link)
2. For account issues, contact Stripe Support together
3. For platform issues, check your logs

**Payment Failed:**
1. Check payment intent status in Stripe Dashboard
2. Review decline reason
3. Advise customer to:
   - Check card balance
   - Try different card
   - Contact their bank

**Transfer Delayed:**
1. Check transfer status in Stripe Dashboard
2. Verify connected account is active
3. Check for pending verification requirements

---

## 14. FUTURE ENHANCEMENTS

### Phase 2 Features

1. **Subscription-based Rent**
   - Auto-charge rent monthly
   - Handle failed payments automatically
   - Grace periods and retry logic

2. **Split Payments**
   - Multiple property owners per property
   - Automatic split transfers

3. **Instant Payouts**
   - Enable instant payouts for Express accounts
   - Higher fee, but immediate availability

4. **International Payments**
   - Multi-currency support
   - Cross-border transfers

5. **Advanced Reporting**
   - Property owner earnings reports
   - Tax summary reports
   - 1099/tax document generation

6. **Payment Plans**
   - Installment payments
   - Partial payment tracking

### Architecture Improvements

1. **Event-Driven Architecture**
   - Use message queue for webhook processing
   - Async background jobs
   - Better scalability

2. **Caching**
   - Cache connected account status
   - Cache fee structures
   - Reduce database queries

3. **Rate Limiting**
   - Protect webhook endpoint
   - Limit API calls to Stripe

---

## 15. CONCLUSION

This implementation provides a complete, production-ready solution for enabling private property owners to accept rent payments via credit/debit cards through your platform.

### Key Takeaways:

1. **Legal Compliance:** Stripe Connect Express accounts allow individuals to accept payments legally
2. **Transparent Fees:** Platform fees are clearly calculated and communicated
3. **Automated Transfers:** Funds automatically distributed to property owners
4. **Security:** PCI-DSS compliant, no direct handling of card data
5. **Scalability:** Supports unlimited property owners and transactions

### Next Steps:

1. Complete database migration
2. Register services in dependency injection
3. Test in Stripe test mode
4. Complete frontend integration
5. Perform end-to-end testing
6. Go live with real transactions

### Success Metrics:

- 95%+ payment success rate
- <2% platform fee revenue leakage
- <5 minute onboarding completion time
- 99.9% webhook processing success
- Zero PCI compliance violations

---

**Document Version:** 1.0
**Last Updated:** November 17, 2025
**Author:** Stripe Integration Architect
**Project:** Rent Manager Platform
