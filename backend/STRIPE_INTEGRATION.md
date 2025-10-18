# Stripe Integration Guide

## Overview

This rent management system is integrated with Stripe for secure online payment processing. Stripe handles credit card, debit card, and online payments for rent collection in the Romanian market.

## Features

- **Payment Intent API**: Secure payment processing with 3D Secure support
- **Webhook Integration**: Real-time payment status updates
- **Refund Support**: Full and partial refunds through Stripe
- **Customer Management**: Automatic Stripe customer creation for tenants
- **RON Currency**: Full support for Romanian Lei (RON)
- **Test Mode**: Separate test and live API keys

## Setup Instructions

### 1. Create a Stripe Account

1. Go to https://stripe.com and sign up for an account
2. Complete the verification process
3. Navigate to **Developers** → **API keys**

### 2. Get Your API Keys

You'll need two sets of keys:

**Test Mode Keys** (for development):
- Publishable key: `pk_test_...`
- Secret key: `sk_test_...`

**Live Mode Keys** (for production):
- Publishable key: `pk_live_...`
- Secret key: `sk_live_...`

### 3. Configure the Application

Update `appsettings.json` with your Stripe keys:

```json
{
  "Stripe": {
    "SecretKey": "sk_test_your_stripe_secret_key_here",
    "PublishableKey": "pk_test_your_stripe_publishable_key_here",
    "WebhookSecret": "whsec_your_webhook_secret_here",
    "Currency": "ron",
    "EnableTestMode": true
  }
}
```

**Important**: Never commit real API keys to source control. Use environment variables or secrets management in production.

### 4. Set Up Webhooks

Webhooks allow Stripe to notify your application about payment events.

#### Development (Local Testing)

1. Install Stripe CLI:
```bash
# Linux/macOS
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe

# Windows
scoop install stripe
```

2. Login to Stripe CLI:
```bash
stripe login
```

3. Forward webhooks to local server:
```bash
stripe listen --forward-to http://localhost:5057/api/webhooks/stripe
```

4. Copy the webhook signing secret (`whsec_...`) to your `appsettings.json`

#### Production

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.processing`
   - `charge.refunded`
5. Copy the webhook signing secret to your production configuration

## How It Works

### Payment Flow

1. **Initiate Payment**
   ```http
   POST /api/payments/initiate
   {
     "tenantId": "tenant-123",
     "amount": 1500.00,
     "method": "CardOnline"
   }
   ```

2. **Create Payment Intent** (Stripe)
   - System creates a Stripe PaymentIntent
   - Returns `client_secret` to frontend

3. **Frontend Confirms Payment**
   - User enters card details in Stripe Elements
   - Stripe handles 3D Secure if required
   - Payment is processed securely

4. **Webhook Confirmation**
   - Stripe sends `payment_intent.succeeded` webhook
   - System updates payment status to `Completed`

### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │────────▶│   Backend    │────────▶│   Stripe    │
│  (React)    │         │  (.NET API)  │         │     API     │
└─────────────┘         └──────────────┘         └─────────────┘
                              │                         │
                              │     Webhook Events      │
                              │◀────────────────────────┘
```

**Components**:
- `IPaymentGateway`: Payment gateway abstraction
- `StripePaymentGateway`: Stripe-specific implementation
- `PaymentService`: Business logic with gateway integration
- `StripeWebhookController`: Webhook event handler

## API Reference

### Create Payment Intent

**Endpoint**: `POST /api/payments/initiate`

**Request**:
```json
{
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 1500.00,
  "method": "CardOnline",
  "notes": "Rent for November 2025"
}
```

**Response**:
```json
{
  "id": "payment-id",
  "tenantId": "tenant-id",
  "amount": 1500.00,
  "status": "Pending",
  "externalTransactionId": "pi_3ABC123...",
  "paymentGatewayProvider": "Stripe"
}
```

### Process Payment

The payment processing happens automatically when:
1. Frontend confirms the payment using Stripe.js
2. Stripe webhook notifies the backend
3. Backend updates the payment status

### Refund Payment

**Endpoint**: `POST /api/payments/refund`

**Request**:
```json
{
  "paymentId": "payment-id",
  "amount": 1500.00,
  "reason": "Tenant requested refund"
}
```

Refunds are processed through Stripe automatically if the payment was made via Stripe.

## Frontend Integration

### Install Stripe.js

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Configure Stripe

```javascript
// src/config/stripe.js
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe('pk_test_your_publishable_key');
```

### Payment Form Component

```javascript
import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from './config/stripe';
import ApiService from './services/api';

const PaymentForm = ({ tenantId, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create payment intent on backend
      const response = await ApiService.initiatePayment({
        tenantId,
        amount,
        method: 'CardOnline'
      });

      const { externalTransactionId } = response;

      // 2. Confirm payment with Stripe
      const { error } = await stripe.confirmCardPayment(externalTransactionId, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (error) {
        console.error(error);
        alert('Payment failed: ' + error.message);
      } else {
        alert('Payment successful!');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : `Pay ${amount} RON`}
      </button>
    </form>
  );
};

const PaymentPage = () => (
  <Elements stripe={stripePromise}>
    <PaymentForm tenantId="tenant-id" amount={1500.00} />
  </Elements>
);

export default PaymentPage;
```

### Update API Service

```javascript
// src/services/api.js
class ApiService {
  async initiatePayment(paymentData) {
    const response = await this.request('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return response;
  }

  // ... other methods
}
```

## Testing

### Test Cards

Stripe provides test cards for development:

| Card Number | Description |
|------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0025 0000 3155 | 3D Secure authentication |
| 4000 0000 0000 9995 | Declined (insufficient funds) |
| 4000 0000 0000 0069 | Expired card |

**CVV**: Any 3 digits
**Expiry**: Any future date
**ZIP**: Any 5 digits

### Test Workflow

1. Start the backend:
```bash
cd backend/RentManager.API
dotnet run
```

2. Start Stripe webhook forwarding:
```bash
stripe listen --forward-to http://localhost:5057/api/webhooks/stripe
```

3. Start the frontend:
```bash
cd frontend
npm start
```

4. Test a payment:
   - Navigate to payment page
   - Enter test card: 4242 4242 4242 4242
   - Complete the payment
   - Check backend logs for webhook events
   - Verify payment status in database

## Security Best Practices

### 1. Never Expose Secret Keys

❌ **Don't**:
```javascript
// Frontend code
const stripe = Stripe('sk_test_...');  // NEVER do this!
```

✅ **Do**:
```javascript
// Frontend code
const stripe = Stripe('pk_test_...');  // Only use publishable key

// Backend code - Secret key stays server-side
StripeConfiguration.ApiKey = _settings.SecretKey;
```

### 2. Validate Webhook Signatures

The webhook controller automatically verifies that webhooks come from Stripe:

```csharp
var isValid = await _paymentGateway.VerifyWebhookSignatureAsync(json, signatureHeader);
if (!isValid) {
    return BadRequest("Invalid signature");
}
```

### 3. Use HTTPS in Production

Stripe requires HTTPS for:
- Webhook endpoints
- API requests
- Frontend integration

### 4. Implement Idempotency

The payment system uses `IdempotencyKey` to prevent duplicate payments:

```csharp
payment.IdempotencyKey = Guid.NewGuid().ToString();
```

### 5. PCI Compliance

- Never store card numbers
- Use Stripe Elements for card input
- Let Stripe handle sensitive data
- The application is PCI-DSS compliant by design

## Monitoring and Logs

### Stripe Dashboard

Monitor payments in real-time:
1. Go to Stripe Dashboard → **Payments**
2. View all transactions, refunds, and disputes
3. Check webhook delivery status
4. Download reports

### Application Logs

The payment service logs all important events:

```csharp
_logger.LogInformation("Payment processed: {PaymentId} via {Method}", paymentId, payment.Method);
_logger.LogError(ex, "Payment processing failed: {PaymentId}", paymentId);
```

Check logs for:
- Payment creation
- Stripe API calls
- Webhook events
- Errors and failures

## Troubleshooting

### Webhook Not Received

1. Check webhook URL is correct
2. Verify webhook secret in configuration
3. Check firewall allows Stripe IPs
4. Test with Stripe CLI: `stripe trigger payment_intent.succeeded`

### Payment Fails

1. Check Stripe Dashboard for error details
2. Verify API keys are correct
3. Check card is not declined
4. Verify amount is not below minimum (50 bani for RON)

### 3D Secure Not Working

1. Ensure using latest Stripe.js version
2. Use test card `4000 0025 0000 3155`
3. Check frontend handles `requires_action` status

## Going Live

### Pre-Launch Checklist

- [ ] Replace test API keys with live keys
- [ ] Update `EnableTestMode` to `false`
- [ ] Configure production webhook endpoint
- [ ] Test with real (small amount) transaction
- [ ] Enable Stripe Radar for fraud detection
- [ ] Set up email receipts in Stripe Dashboard
- [ ] Configure statement descriptor
- [ ] Review Stripe fees and pricing

### Production Configuration

```json
{
  "Stripe": {
    "SecretKey": "sk_live_...",
    "PublishableKey": "pk_live_...",
    "WebhookSecret": "whsec_...",
    "Currency": "ron",
    "EnableTestMode": false
  }
}
```

### Compliance

- Review Stripe's terms of service
- Ensure privacy policy mentions Stripe
- Display Stripe badge on payment page
- Comply with Romanian payment regulations

## Support

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **API Status**: https://status.stripe.com

## Fees

Stripe charges:
- **European cards**: 1.5% + 0.25 EUR
- **Non-European cards**: 2.9% + 0.25 EUR
- **No setup fees or monthly fees**

These fees are automatically calculated and stored in the `ProcessingFee` field.

## Advanced Features

### Recurring Subscriptions

For automatic monthly rent collection, Stripe Billing can be integrated:

```csharp
var subscriptionOptions = new SubscriptionCreateOptions
{
    Customer = customerId,
    Items = new List<SubscriptionItemOptions>
    {
        new SubscriptionItemOptions { Price = priceId }
    }
};
```

### Payment Links

Generate payment links for tenants:

```csharp
var linkOptions = new PaymentLinkCreateOptions
{
    LineItems = new List<PaymentLinkLineItemOptions>
    {
        new PaymentLinkLineItemOptions { Price = priceId, Quantity = 1 }
    }
};
var link = await service.CreateAsync(linkOptions);
```

### Stripe Connect

For marketplace/platform scenarios where property owners receive payments directly.

## Example Scenarios

### Scenario 1: Tenant Pays Rent Online

1. Tenant logs into their dashboard
2. Clicks "Pay Rent" button
3. Enters card details in Stripe form
4. Stripe processes payment with 3D Secure
5. Webhook confirms payment
6. Tenant receives confirmation email
7. Property owner sees payment in dashboard

### Scenario 2: Refund Processing

1. Property owner initiates refund
2. System calls Stripe refund API
3. Stripe processes refund (5-10 business days)
4. Webhook confirms refund
5. Tenant receives refund to original payment method

## Conclusion

The Stripe integration provides a secure, compliant, and user-friendly payment solution for the Romanian rental market. The modular architecture allows easy extension to other payment gateways if needed.

For questions or issues, refer to the Stripe documentation or contact support.
