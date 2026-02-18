// lib/supabase/dodo-types.ts
// Dodo-specific database types

export type DodoSubscription = {
  id: string
  user_id: string
  tier: string
  status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  dodo_customer_id: string | null
  dodo_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  billing_cycle: string | null
  created_at: string | null
  updated_at: string | null
}

export type DodoInvoice = {
  id: string
  user_id: string
  stripe_invoice_id: string
  dodo_payment_id: string | null
  amount: number
  currency: string
  status: string
  invoice_pdf: string | null
  period_start: string
  period_end: string
  created_at: string | null
}