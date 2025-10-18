# Payment Service Documentation

## Overview

The Payment Service is a comprehensive solution for handling rent payments in the Romanian market. It provides features for payment processing, transaction tracking, recurring payments, and Romanian-specific payment methods.

## Features

### 1. Payment Processing
- **Initiate Payment**: Start a new payment transaction
- **Process Payment**: Execute payment processing with external gateway integration
- **Confirm Payment**: Confirm payment with a confirmation code
- **Cancel Payment**: Cancel pending payments
- **Refund Payment**: Process full or partial refunds

### 2. Romanian Market Support
- **IBAN Validation**: Validate Romanian IBAN format (RO + 2 check digits + 20 characters)
- **Payment References**: Generate unique payment references for bank transfers (Format: `RENT-YYYYMM-TENANTID`)
- **Bank Transfer Support**: Track bank account details and transfer confirmations
- **Payment Reconciliation**: Match incoming bank transfers with pending payments

### 3. Payment Methods
- Cash
- Check
- BankTransfer
- CreditCard
- DebitCard
- Online
- MobilePay
- CardOnline

### 4. Payment Statuses
- Pending
- Processing
- Completed
- Failed
- Cancelled
- Refunded

### 5. Recurring Payments
- Automatic monthly payment generation for active tenants
- Track recurring payment for specific months
- Avoid duplicate recurring payments

### 6. Analytics and Reporting
- Total collected amount by date range
- Payment distribution by method
- Payment distribution by status
- Payment statistics and averages

## API Endpoints

### Basic Operations

#### GET /api/payments
Get all payments for the current user (filtered by role)

**Response**: `List<Payment>`

---

#### GET /api/payments/{id}
Get a specific payment by ID

**Parameters**:
- `id` (string): Payment ID

**Response**: `Payment`

---

#### GET /api/payments/tenant/{tenantId}
Get all payments for a specific tenant

**Parameters**:
- `tenantId` (string): Tenant ID

**Response**: `List<Payment>`

---

#### GET /api/payments/property/{propertyId}
Get all payments for a specific property

**Parameters**:
- `propertyId` (string): Property ID

**Response**: `List<Payment>`

---

#### POST /api/payments
Create a new payment manually

**Request Body**: `Payment`

**Response**: `Payment` (201 Created)

---

#### PUT /api/payments/{id}
Update an existing payment

**Parameters**:
- `id` (string): Payment ID

**Request Body**: `Payment`

**Response**: `Payment`

---

#### DELETE /api/payments/{id}
Delete a payment (admin only)

**Parameters**:
- `id` (string): Payment ID

**Response**: 204 No Content

---

### Payment Processing

#### POST /api/payments/initiate
Initiate a new payment transaction

**Request Body**:
```json
{
  "tenantId": "string",
  "amount": 0,
  "method": "BankTransfer",
  "notes": "string",
  "bankIBAN": "RO49AAAA1B31007593840000",
  "bankAccountHolder": "string"
}
```

**Response**: `Payment` (201 Created)

---

#### POST /api/payments/process
Process a payment

**Request Body**:
```json
{
  "paymentId": "string",
  "externalTransactionId": "string",
  "paymentGatewayProvider": "string"
}
```

**Response**: `Payment`

---

#### POST /api/payments/confirm
Confirm a payment with a confirmation code

**Request Body**:
```json
{
  "paymentId": "string",
  "confirmationCode": "string"
}
```

**Response**: `Payment`

---

#### POST /api/payments/cancel
Cancel a pending payment

**Request Body**:
```json
{
  "paymentId": "string",
  "reason": "string"
}
```

**Response**: `Payment`

---

#### POST /api/payments/refund
Refund a completed payment

**Request Body**:
```json
{
  "paymentId": "string",
  "amount": 0,
  "reason": "string"
}
```

**Response**: `Payment`

---

### Payment Reconciliation

#### GET /api/payments/pending
Get all pending payments

**Response**: `List<Payment>`

---

#### GET /api/payments/failed
Get failed payments within a date range

**Query Parameters**:
- `from` (DateTime, optional): Start date
- `to` (DateTime, optional): End date

**Response**: `List<Payment>`

---

#### POST /api/payments/reconcile
Reconcile a payment by reference

**Request Body**:
```json
{
  "paymentReference": "RENT-202510-ABC12345",
  "amount": 0,
  "date": "2025-10-18T00:00:00Z",
  "bankIBAN": "RO49AAAA1B31007593840000"
}
```

**Response**: `Payment`

---

### Recurring Payments

#### POST /api/payments/recurring/generate
Generate recurring payments for a month (Admin/PropertyOwner only)

**Request Body**:
```json
{
  "year": 2025,
  "month": 10
}
```

**Response**: `List<Payment>`

---

#### GET /api/payments/tenant/{tenantId}/last
Get the last payment for a tenant

**Parameters**:
- `tenantId` (string): Tenant ID

**Response**: `Payment`

---

### Romanian Specific

#### GET /api/payments/reference/generate
Generate a Romanian payment reference

**Query Parameters**:
- `tenantId` (string): Tenant ID
- `year` (int): Year
- `month` (int): Month

**Response**:
```json
{
  "reference": "RENT-202510-ABC12345"
}
```

---

#### POST /api/payments/validate-iban
Validate a Romanian IBAN

**Request Body**:
```json
{
  "iban": "RO49AAAA1B31007593840000"
}
```

**Response**:
```json
{
  "isValid": true,
  "errorMessage": null
}
```

---

### Analytics

#### GET /api/payments/statistics
Get payment statistics

**Query Parameters**:
- `from` (DateTime, optional): Start date (default: 12 months ago)
- `to` (DateTime, optional): End date (default: now)

**Response**:
```json
{
  "totalCollected": 0,
  "totalPayments": 0,
  "byMethod": {
    "BankTransfer": 0,
    "Cash": 0
  },
  "byStatus": {
    "Completed": 0,
    "Pending": 0
  },
  "averagePayment": 0,
  "monthlyBreakdown": []
}
```

---

#### GET /api/payments/total-collected
Get total collected amount

**Query Parameters**:
- `from` (DateTime, optional): Start date
- `to` (DateTime, optional): End date

**Response**:
```json
{
  "total": 0
}
```

---

## Payment Model

```csharp
public class Payment
{
    // Basic fields
    public string Id { get; set; }
    public string TenantId { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; }
    public string? Notes { get; set; }

    // Transaction tracking
    public string? ExternalTransactionId { get; set; }
    public string? PaymentGatewayProvider { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public decimal? ProcessingFee { get; set; }
    public string? FailureReason { get; set; }
    public string? IdempotencyKey { get; set; }

    // Romanian specific fields
    public string? PaymentReference { get; set; }
    public string? BankIBAN { get; set; }
    public string? BankAccountHolder { get; set; }
    public string? ConfirmationCode { get; set; }

    // Recurring payment tracking
    public bool IsRecurring { get; set; }
    public DateTime? RecurringForMonth { get; set; }

    // Refund tracking
    public bool IsRefunded { get; set; }
    public string? RefundedPaymentId { get; set; }
    public DateTime? RefundedAt { get; set; }
    public string? RefundReason { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

## Usage Examples

### Example 1: Initiate a Bank Transfer Payment

```bash
POST /api/payments/initiate
Content-Type: application/json
Authorization: Bearer {token}

{
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 1500.00,
  "method": "BankTransfer",
  "notes": "Rent for October 2025",
  "bankIBAN": "RO49AAAA1B31007593840000",
  "bankAccountHolder": "John Doe"
}
```

**Response**:
```json
{
  "id": "987fcdeb-51a2-43f7-b456-426614174001",
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 1500.00,
  "date": "2025-10-18T10:30:00Z",
  "method": "BankTransfer",
  "status": "Pending",
  "paymentReference": "RENT-202510-123E4567",
  "bankIBAN": "RO49AAAA1B31007593840000",
  "bankAccountHolder": "John Doe",
  "createdAt": "2025-10-18T10:30:00Z",
  "updatedAt": "2025-10-18T10:30:00Z"
}
```

---

### Example 2: Reconcile Bank Transfer

```bash
POST /api/payments/reconcile
Content-Type: application/json
Authorization: Bearer {token}

{
  "paymentReference": "RENT-202510-123E4567",
  "amount": 1500.00,
  "date": "2025-10-18T14:00:00Z",
  "bankIBAN": "RO49AAAA1B31007593840000"
}
```

---

### Example 3: Generate Recurring Payments

```bash
POST /api/payments/recurring/generate
Content-Type: application/json
Authorization: Bearer {token}

{
  "year": 2025,
  "month": 11
}
```

This will automatically create pending payments for all active tenants for November 2025.

---

### Example 4: Validate Romanian IBAN

```bash
POST /api/payments/validate-iban
Content-Type: application/json
Authorization: Bearer {token}

{
  "iban": "RO49AAAA1B31007593840000"
}
```

**Response**:
```json
{
  "isValid": true,
  "errorMessage": null
}
```

---

## Integration with Romanian Payment Gateways

The payment service is designed to integrate with popular Romanian payment gateways:

1. **mobilPay** - One of the largest payment processors in Romania
2. **Netopia Payments** - Complete payment solution
3. **euplatesc** - Romanian payment gateway
4. **PayU Romania** - International payment processor with Romanian support

### Integration Steps

1. Add payment gateway SDK/library to the project
2. Configure gateway credentials in `appsettings.json`
3. Implement gateway-specific payment processing in `PaymentService.ProcessPaymentAsync()`
4. Handle webhooks for payment confirmation
5. Store `ExternalTransactionId` and `PaymentGatewayProvider` for tracking

### Example Configuration

```json
{
  "PaymentGateways": {
    "mobilPay": {
      "MerchantId": "your-merchant-id",
      "SecretKey": "your-secret-key",
      "ApiUrl": "https://secure.mobilpay.ro"
    },
    "Netopia": {
      "ApiKey": "your-api-key",
      "SecretKey": "your-secret-key",
      "ApiUrl": "https://secure.netopia-payments.com"
    }
  }
}
```

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Role-based access control (Admin, PropertyOwner, Renter)
3. **Idempotency**: Use `IdempotencyKey` to prevent duplicate payments
4. **HTTPS**: Always use HTTPS in production
5. **Data Encryption**: Store sensitive data (IBAN, card details) encrypted
6. **PCI Compliance**: Never store full card numbers
7. **Audit Trail**: All payment actions are logged with timestamps

## Error Handling

The service uses standard HTTP status codes:

- `200 OK` - Successful operation
- `201 Created` - Payment created
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Payment not found
- `500 Internal Server Error` - Server error

## Testing

Run the backend tests:

```bash
cd backend
dotnet test
```

## Future Enhancements

1. **Email Notifications**: Send payment confirmations to tenants
2. **SMS Notifications**: Romanian SMS gateway integration
3. **Automatic Reminders**: Send reminders for pending payments
4. **Payment Plans**: Support for installment payments
5. **Multi-Currency**: Support for EUR alongside RON
6. **Late Fees**: Automatic calculation of late payment fees
7. **Payment Reports**: Generate PDF reports for tenants and property owners
8. **Webhooks**: External webhooks for payment events
9. **Payment Links**: Generate payment links for tenants
10. **QR Codes**: Generate QR codes for bank transfers

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
