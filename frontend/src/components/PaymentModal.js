import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import apiService from '../services/api';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

function PaymentForm({ amount, tenantId, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CardOnline');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (paymentMethod === 'CardOnline') {
      if (!stripe || !elements) {
        return;
      }

      setProcessing(true);
      setError(null);

      try {
        // Step 1: Initiate payment on backend
        const initiateResponse = await apiService.initiatePayment({
          tenantId,
          amount,
          method: paymentMethod,
          notes: `Rent payment for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
        });

        if (!initiateResponse.clientSecret) {
          throw new Error('Failed to initialize payment');
        }

        // Step 2: Confirm payment with Stripe
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          initiateResponse.clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardElement),
            }
          }
        );

        if (stripeError) {
          setError(stripeError.message);
          setProcessing(false);
          return;
        }

        // Step 3: Process payment on backend
        if (paymentIntent.status === 'succeeded') {
          await apiService.processPayment(initiateResponse.paymentId, {
            externalTransactionId: paymentIntent.id,
            paymentGatewayProvider: 'Stripe'
          });

          onSuccess();
        }
      } catch (err) {
        setError(err.message || 'Payment failed. Please try again.');
        setProcessing(false);
      }
    } else if (paymentMethod === 'BankTransfer') {
      // Handle bank transfer
      setProcessing(true);
      setError(null);

      try {
        const response = await apiService.initiatePayment({
          tenantId,
          amount,
          method: paymentMethod,
          notes: `Rent payment for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
        });

        // Show payment reference for bank transfer
        alert(`Payment initiated! Please use this reference when making the transfer:\n\nReference: ${response.paymentReference}\n\nBank details will be provided by your landlord.`);
        onSuccess();
      } catch (err) {
        setError(err.message || 'Failed to initiate payment. Please try again.');
        setProcessing(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
        Pay Rent
      </h3>

      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: 'var(--primary-color)',
          textAlign: 'center',
          marginBottom: '10px'
        }}>
          ${amount.toLocaleString()}
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Amount to Pay
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Payment Method
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '16px'
          }}
          disabled={processing}
        >
          <option value="CardOnline">Credit/Debit Card</option>
          <option value="BankTransfer">Bank Transfer</option>
        </select>
      </div>

      {paymentMethod === 'CardOnline' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Card Details
          </label>
          <div style={{
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff'
          }}>
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>
      )}

      {paymentMethod === 'BankTransfer' && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bfdbfe',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e40af' }}>
            <strong>Note:</strong> You will receive a payment reference to use when making the bank transfer.
            The payment will be marked as pending until confirmed by your landlord.
          </p>
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c00',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="btn"
          style={{
            padding: '10px 20px',
            backgroundColor: '#e5e7eb',
            color: '#374151',
            border: 'none',
            borderRadius: '4px',
            cursor: processing ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={processing || (paymentMethod === 'CardOnline' && !stripe)}
          className="btn btn-primary"
          style={{
            padding: '10px 20px',
            opacity: processing ? 0.7 : 1,
            cursor: processing ? 'not-allowed' : 'pointer'
          }}
        >
          {processing ? 'Processing...' : `Pay $${amount.toLocaleString()}`}
        </button>
      </div>
    </form>
  );
}

function PaymentModal({ isOpen, amount, tenantId, onSuccess, onClose }) {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    // Load Stripe publishable key from backend
    const loadStripeKey = async () => {
      try {
        const config = await apiService.getStripeConfig();
        if (config && config.publishableKey) {
          setStripePromise(loadStripe(config.publishableKey));
        }
      } catch (error) {
        console.error('Failed to load Stripe configuration:', error);
      }
    };

    if (isOpen) {
      loadStripeKey();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <PaymentForm
              amount={amount}
              tenantId={tenantId}
              onSuccess={onSuccess}
              onCancel={onClose}
            />
          </Elements>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Loading payment system...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;
