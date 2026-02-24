// lib/email/templates/invoice-email.ts
import { emailWrapper, intro, body, cta, details, p, getEmailVars } from './_base'

export interface InvoiceEmailData {
  userName: string
  invoiceId: string
  amount: number
  currency: string
  planName: string
  billingDate: string
  nextBillingDate?: string
  paymentId: string
}

export function buildInvoiceEmailHtml(data: InvoiceEmailData): string {
  const { appUrl } = getEmailVars()

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency.toUpperCase() })
  const formattedAmount = fmt.format(data.amount / 100)
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const content = body(`
    <div style="text-align:center;padding:8px 0 4px;">
      <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.7px;font-weight:600;">Amount paid</p>
      <p style="margin:0;font-size:40px;font-weight:700;color:#0f172a;letter-spacing:-1px;">${formattedAmount}</p>
    </div>
    ${details([
      { label: 'Plan', value: data.planName },
      { label: 'Billing date', value: fmtDate(data.billingDate) },
      ...(data.nextBillingDate ? [{ label: 'Next billing date', value: fmtDate(data.nextBillingDate) }] : []),
      { label: 'Invoice ID', value: data.invoiceId, mono: true },
      { label: 'Payment ID', value: data.paymentId, mono: true },
    ])}
    <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">Keep this email as your receipt.</p>
    ${cta(`${appUrl}/dashboard`, 'Go to dashboard →')}
  `)

  return emailWrapper(
    intro('✓', 'Payment confirmed', `Hi ${data.userName}, here's your receipt.`) + content,
    'Payment confirmed - Owtra'
  )
}