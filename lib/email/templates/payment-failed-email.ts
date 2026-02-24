// lib/email/templates/payment-failed-email.ts
import { emailWrapper, intro, body, cta, details, p, sectionLabel, getEmailVars } from './_base'

export interface PaymentFailedEmailData {
  userName: string
  amount: number
  currency: string
  planName: string
  paymentId: string
  failureReason?: string
}

export function buildPaymentFailedEmailHtml(data: PaymentFailedEmailData): string {
  const { appUrl } = getEmailVars()

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency.toUpperCase(),
  }).format(data.amount / 100)

  const content = body(`
    ${p(`We were unable to charge <strong style="color:#0f172a;">${formattedAmount}</strong> for your <strong style="color:#0f172a;">${data.planName}</strong> subscription. Your account remains active while you sort this out.`)}
    ${details([
      { label: 'Amount', value: formattedAmount },
      { label: 'Plan', value: data.planName },
      { label: 'Payment ID', value: data.paymentId, mono: true },
      ...(data.failureReason ? [{ label: 'Reason', value: data.failureReason }] : []),
    ])}
    ${sectionLabel('What to do')}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:4px;">
      <tr>
        <td width="24" valign="top" style="font-size:13px;color:#0f172a;font-weight:700;padding-top:2px;">1.</td>
        <td style="padding-bottom:10px;font-size:14px;color:#475569;line-height:1.6;">Check that your card details are correct and the card hasn't expired.</td>
      </tr>
      <tr>
        <td width="24" valign="top" style="font-size:13px;color:#0f172a;font-weight:700;padding-top:2px;">2.</td>
        <td style="padding-bottom:10px;font-size:14px;color:#475569;line-height:1.6;">Ensure sufficient funds and that your card allows online or international transactions.</td>
      </tr>
      <tr>
        <td width="24" valign="top" style="font-size:13px;color:#0f172a;font-weight:700;padding-top:2px;">3.</td>
        <td style="font-size:14px;color:#475569;line-height:1.6;">Update your payment method - your subscription will retry automatically.</td>
      </tr>
    </table>
    ${cta(`${appUrl}/dashboard/billing`, 'Update payment method →')}
  `)

  return emailWrapper(
    intro('⚠️', 'Payment unsuccessful', `Hi ${data.userName}, we couldn't process your payment.`) + content,
    'Payment failed - Owtra'
  )
}