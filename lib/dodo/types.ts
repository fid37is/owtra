/**
 * Dodo Payments TypeScript Types
 * Based on Dodo Payments API Documentation
 */

// Subscription Plans Configuration
export interface SubscriptionPlan {
  id: string
  name: string
  price: number // in cents
  interval: 'month' | 'year'
  description: string
  features: string[]
  product_id?: string // Dodo product ID from dashboard
}

// Dodo API Types
export interface DodoCustomer {
  customer_id: string
  email: string
  name: string
}

export interface DodoBilling {
  city: string
  country: string
  state: string
  street: string
  zipcode: string
}

export interface DodoSubscriptionStatus {
  subscription_id: string
  product_id: string
  customer: DodoCustomer
  status: 'active' | 'cancelled' | 'past_due' | 'on_hold' | 'pending'
  recurring_pre_tax_amount: number
  currency: string
  payment_frequency_count: number
  payment_frequency_interval: 'Day' | 'Week' | 'Month' | 'Year'
  next_billing_date: string
  previous_billing_date?: string
  created_at: string
  cancelled_at?: string
  expires_at?: string
  cancel_at_next_billing_date?: boolean
  quantity?: number
  metadata?: Record<string, any>
}

export interface DodoCheckoutSession {
  session_id: string
  checkout_url: string
  expires_at: string
}

export interface DodoPayment {
  payment_id: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed' | 'refunded'
  customer: DodoCustomer
  created_at: string
  invoice_pdf?: string
}

export interface DodoPortalSession {
  portal_url: string
  expires_at: string
}

// Webhook Event Types
export type DodoWebhookEventType =
  | 'subscription.created'
  | 'subscription.renewed'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'customer.created'
  | 'customer.updated'

export interface DodoWebhookPayload {
  event_type: DodoWebhookEventType
  event_id: string
  business_id: string
  test: boolean
  created_at: string
  data: {
    subscription?: DodoSubscriptionStatus
    payment?: DodoPayment
    customer?: DodoCustomer
  }
}

// Webhook Headers
export interface DodoWebhookHeaders {
  'webhook-id': string
  'webhook-signature': string
  'webhook-timestamp': string
}

// API Request/Response Types
export interface CreateCheckoutSessionRequest {
  userId: string
  email: string
  productId: string
  billingCycle: 'monthly' | 'yearly'
  successUrl?: string
  cancelUrl?: string
}

export interface CreateCheckoutSessionResponse {
  sessionId: string
  checkoutUrl: string
}

export interface UpdateSubscriptionRequest {
  subscriptionId: string
  cancel_at_next_billing_date?: boolean
}

export interface CancelSubscriptionRequest {
  subscriptionId: string
}

export interface CreatePortalSessionRequest {
  customerId: string
}

export interface CreatePortalSessionResponse {
  [x: string]: string
  portalUrl: string
}

// Environment Variables Type
export interface DodoPaymentsConfig {
  apiKey: string
  webhookSecret: string
  environment: 'test_mode' | 'live_mode'
  monthlyProductId: string
  yearlyProductId: string
}