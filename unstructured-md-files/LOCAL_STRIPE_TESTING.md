# Local Stripe Testing Guide

## Quick Start

Yes! You can test Stripe payments locally. Here's how:

## Step 1: Create a Free Stripe Test Account

1. Go to https://stripe.com
2. Click **Sign up** (it's free)
3. Complete the registration
4. You'll be in **Test mode** by default (perfect for development)

## Step 2: Get Your Test API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. You'll see two keys in test mode:
   - **Publishable key**: `pk_test_...` (safe to use in frontend)
   - **Secret key**: `sk_test_...` (keep this private!)

3. Copy both keys

## Step 3: Configure Your Application

Update `appsettings.json` with your test keys:

```json
{
  "Stripe": {
    "SecretKey": "sk_test_51AbC...your_actual_key_here",
    "PublishableKey": "pk_test_51AbC...your_actual_key_here",
    "WebhookSecret": "whsec_...",  // We'll get this in Step 5
    "Currency": "ron",
    "EnableTestMode": true
  }
}
```

**Important**: Don't commit real keys to git! Consider using environment variables:

```bash
# Set environment variables (Linux/macOS)
export Stripe__SecretKey="sk_test_..."
export Stripe__PublishableKey="pk_test_..."

# Or create appsettings.Development.json (git-ignored)
```

## Step 4: Install Stripe CLI (for Webhooks)

The Stripe CLI lets you receive webhooks locally.

### Linux (Debian/Ubuntu)
```bash
# Add Stripe repository
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list

# Install
sudo apt update
sudo apt install stripe
```

### Alternative: Download Binary
```bash
# Download latest release
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.5/stripe_1.19.5_linux_x86_64.tar.gz

# Extract
tar -xvf stripe_1.19.5_linux_x86_64.tar.gz

# Move to PATH
sudo mv stripe /usr/local/bin/

# Verify
stripe --version
```

### Windows
```powershell
# Using Scoop
scoop install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

## Step 5: Set Up Local Webhooks

1. **Login to Stripe CLI**:
```bash
stripe login
```
This will open a browser to authorize the CLI.

2. **Start Webhook Forwarding**:
```bash
stripe listen --forward-to http://localhost:5057/api/webhooks/stripe
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

3. **Copy the webhook secret** (`whsec_...`) to your `appsettings.json`:
```json
{
  "Stripe": {
    "WebhookSecret": "whsec_1234567890abcdef..."
  }
}
```

Keep this terminal window open while testing!

## Step 6: Start Your Backend

Open a new terminal:

```bash
cd "/home/adrian/IT Projects/Rent-Manager/backend/RentManager.API"
dotnet run
```

Your API will be available at: `http://localhost:5057`

## Step 7: Test the Payment Flow

### Option A: Using Swagger UI

1. Open browser: http://localhost:5057/swagger

2. **Create a test payment**:
   - Endpoint: `POST /api/payments/initiate`
   - Click **Try it out**
   - Request body:
   ```json
   {
     "tenantId": "test-tenant-123",
     "amount": 1500.00,
     "method": "CardOnline",
     "notes": "Test rent payment"
   }
   ```
   - Click **Execute**

3. You'll get a response with `externalTransactionId` (the Stripe Payment Intent ID)

4. **View in Stripe Dashboard**:
   - Go to https://dashboard.stripe.com/test/payments
   - You'll see the payment intent created!

### Option B: Using cURL

```bash
# First, get JWT token (login)
curl -X POST http://localhost:5057/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'

# Copy the token from response

# Create payment
curl -X POST http://localhost:5057/api/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "tenantId": "test-tenant-id",
    "amount": 1500.00,
    "method": "CardOnline"
  }'
```

### Option C: Using Postman

1. Import the API endpoints
2. Set base URL: `http://localhost:5057/api`
3. Create payment using `/payments/initiate`

## Step 8: Simulate Payment Completion

Since we don't have a frontend yet, simulate payment completion:

```bash
# Trigger a successful payment event
stripe trigger payment_intent.succeeded
```

Check your terminal with `stripe listen` - you'll see the webhook being sent!
Check your backend logs - you'll see the payment status updated to "Completed"!

## Test Cards

Use these test card numbers (they won't charge real money):

| Card Number | Scenario | CVV | Expiry |
|------------|----------|-----|--------|
| 4242 4242 4242 4242 | Success | Any 3 digits | Any future date |
| 4000 0025 0000 3155 | Requires 3D Secure | Any 3 digits | Any future date |
| 4000 0000 0000 9995 | Declined (insufficient funds) | Any 3 digits | Any future date |
| 4000 0000 0000 0069 | Expired card | Any 3 digits | Any future date |
| 4000 0000 0000 0341 | Declined (processing error) | Any 3 digits | Any future date |

## Complete Test Workflow

Here's a complete end-to-end test:

### Terminal 1: Backend
```bash
cd "/home/adrian/IT Projects/Rent-Manager/backend/RentManager.API"
dotnet run
```

### Terminal 2: Stripe Webhooks
```bash
stripe listen --forward-to http://localhost:5057/api/webhooks/stripe
```

### Terminal 3: Test Commands
```bash
# 1. Create a payment
curl -X POST http://localhost:5057/api/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 1500.00,
    "method": "CardOnline"
  }'

# Save the payment ID from response

# 2. Simulate successful payment
stripe trigger payment_intent.succeeded

# 3. Check payment status
curl -X GET http://localhost:5057/api/payments/YOUR_PAYMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should show status: "Completed"!
```

## Testing Different Scenarios

### Scenario 1: Successful Payment
```bash
stripe trigger payment_intent.succeeded
```

### Scenario 2: Failed Payment
```bash
stripe trigger payment_intent.payment_failed
```

### Scenario 3: Cancelled Payment
```bash
stripe trigger payment_intent.canceled
```

### Scenario 4: Refund
```bash
# First create and complete a payment, then:
curl -X POST http://localhost:5057/api/payments/refund \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "paymentId": "your-payment-id",
    "amount": 1500.00,
    "reason": "Test refund"
  }'

# Trigger refund webhook
stripe trigger charge.refunded
```

## View Test Data

1. **Stripe Dashboard**: https://dashboard.stripe.com/test/payments
   - View all payments
   - See payment details
   - Check webhook deliveries

2. **Database**: Check PostgreSQL
   ```bash
   psql -U postgres -d rent-manager
   SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;
   ```

3. **Backend Logs**: Check console output for:
   - Payment creation
   - Stripe API calls
   - Webhook events
   - Status updates

## Troubleshooting

### Problem: "Invalid API key"
- Check that you copied the correct `sk_test_...` key
- Make sure you're using test mode keys, not live mode

### Problem: "Webhook signature verification failed"
- Restart `stripe listen` to get a fresh webhook secret
- Update the `WebhookSecret` in appsettings.json
- Restart your backend

### Problem: "Payment not updating to Completed"
- Check that Stripe CLI is running (`stripe listen`)
- Verify webhook endpoint is correct
- Check backend logs for errors
- Trigger event manually: `stripe trigger payment_intent.succeeded`

### Problem: "Cannot connect to localhost:5057"
- Check backend is running: `dotnet run`
- Verify port 5057 is not in use
- Check firewall settings

## Testing Without Stripe CLI (Alternative)

If you can't install Stripe CLI, you can test without webhooks:

1. **Manual Status Update**:
   ```bash
   # After creating payment, manually process it
   curl -X POST http://localhost:5057/api/payments/process \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "paymentId": "your-payment-id",
       "externalTransactionId": "pi_test_123"
     }'
   ```

2. **Use Stripe Dashboard**:
   - Go to https://dashboard.stripe.com/test/payments
   - Click on a payment
   - Click "Capture" or "Cancel" manually
   - Check your database for updates

## Next Steps: Frontend Integration

Once backend testing works, integrate with frontend:

```bash
cd "/home/adrian/IT Projects/Rent-Manager/frontend"
npm install @stripe/stripe-js @stripe/react-stripe-js
```

See `STRIPE_INTEGRATION.md` for complete frontend integration guide.

## Quick Reference

**Test Mode**: All test data is isolated and safe
**Test Cards**: Always use 4242 4242 4242 4242 for success
**Webhooks**: Require Stripe CLI or ngrok for local testing
**Dashboard**: https://dashboard.stripe.com/test
**Logs**: Watch `stripe listen` and backend console

## Production Checklist

Before going live:
- [ ] Get live API keys from Stripe Dashboard
- [ ] Update configuration with live keys
- [ ] Set `EnableTestMode: false`
- [ ] Configure production webhook endpoint
- [ ] Test with small real transaction
- [ ] Enable Stripe Radar for fraud protection

---

**You're all set!** Start with Step 1 and work through each step. The whole setup takes about 10-15 minutes.

Questions? Check the logs or Stripe Dashboard for details.
