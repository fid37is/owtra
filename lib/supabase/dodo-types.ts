// lib/supabase/dodo-types.ts
// Dodo-specific types (billing/payments) + app-level types

import { Tables } from "./database.types"

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

// Aliases for convenience
export type Subscription = DodoSubscription
export type Invoice = DodoInvoice

// Profile - Omit Json-typed fields we want to override with proper types
export type Profile = Omit<Tables<'profiles'>, 'resumes'> & {
  is_admin: boolean | null
  resumes: { url: string; fileName: string; isPrimary: boolean }[] | null
}

// Interview prep types (app-level, not a DB table)
export type InterviewQuestion = {
  id: string
  category: string
  question: string
  tips: string[]
  sample_answer?: string
}

export type InterviewPrep = {
  questions: InterviewQuestion[]
  key_topics: string[]
  preparation_tips: string[]
  company_insights: string[]
  generated_at: string
}

// Application extends DB type with optional company join
export type Application = Tables<'applications'> & {
  company?: Tables<'companies'> | null
}