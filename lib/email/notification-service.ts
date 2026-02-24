// lib/email/notification-service.ts
// Pure router - no HTML here. Edit files in ./templates/ to change email designs.

import { Resend } from 'resend'
import { buildWelcomeEmailHtml } from './templates/welcome-email'
import { buildInvoiceEmailHtml, type InvoiceEmailData } from './templates/invoice-email'
import { buildPaymentFailedEmailHtml, type PaymentFailedEmailData } from './templates/payment-failed-email'
import { buildAccountHibernatedEmailHtml } from './templates/account-hibernated-email'
import { buildAccountDeletedEmailHtml } from './templates/account-deleted-email'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_ADDRESS = 'Owtra <noreply@owtra.xyz>'

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const data = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html })
    if (data.error) {
      console.error('Resend error:', data.error)
      return { success: false, error: data.error }
    }
    return { success: true, data }
  } catch (error) {
    console.error('Email exception:', error)
    return { success: false, error }
  }
}

export async function sendWelcomeEmail(email: string, userName: string) {
  return sendEmail(
    email,
    `Welcome to Owtra, ${userName} - a note from our CEO`,
    buildWelcomeEmailHtml(userName)
  )
}

export type InvoiceEmailParams = InvoiceEmailData & { email: string }
export async function sendInvoiceEmail({ email, ...data }: InvoiceEmailParams) {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency.toUpperCase(),
  }).format(data.amount / 100)
  return sendEmail(
    email,
    `Your Owtra receipt - ${amount} for ${data.planName}`,
    buildInvoiceEmailHtml(data)
  )
}

export type PaymentFailedEmailParams = PaymentFailedEmailData & { email: string }
export async function sendPaymentFailedEmail({ email, ...data }: PaymentFailedEmailParams) {
  return sendEmail(
    email,
    `Action required - payment failed for your Owtra ${data.planName}`,
    buildPaymentFailedEmailHtml(data)
  )
}

export async function sendAccountHibernatedEmail(email: string, userName: string) {
  return sendEmail(
    email,
    'Your Owtra account has been hibernated',
    buildAccountHibernatedEmailHtml(userName)
  )
}

export async function sendAccountDeletedEmail(email: string, userName: string, deletionDate: string) {
  return sendEmail(
    email,
    'Your Owtra account is scheduled for deletion',
    buildAccountDeletedEmailHtml(userName, deletionDate)
  )
}