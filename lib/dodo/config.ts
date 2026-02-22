/**
 * Dodo Payments Client Configuration
 * Pricing now comes from database
 */

import DodoPayments from 'dodopayments'
import type { DodoPaymentsConfig } from './types'

// Environment Configuration
export const dodoConfig: DodoPaymentsConfig = {
  apiKey: process.env.DODO_PAYMENTS_API_KEY || '',
  webhookSecret: process.env.DODO_PAYMENTS_WEBHOOK_SECRET || '',
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') || 'test_mode',
  monthlyProductId: '', // Fetched from database
  yearlyProductId: '', // Fetched from database
}

// Initialize Dodo Payments Client
export const dodoClient = new DodoPayments({
  bearerToken: dodoConfig.apiKey,
  environment: dodoConfig.environment,
})

// Format price for display
export function formatPrice(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

// Validate environment variables
export function validateDodoConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!dodoConfig.apiKey) {
    errors.push('DODO_PAYMENTS_API_KEY is not set')
  }

  if (!dodoConfig.webhookSecret) {
    errors.push('DODO_PAYMENTS_WEBHOOK_SECRET is not set')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}