// lib/email/templates/account-hibernated-email.ts
import { emailWrapper, intro, body, cta, p, getEmailVars } from './_base'

export function buildAccountHibernatedEmailHtml(userName: string): string {
  const { appUrl } = getEmailVars()

  const content = body(`
    ${p(`Your Owtra account has been temporarily hibernated. All your data - every application you've logged, your notes, and your research, is safely stored and waiting for you.`)}
    ${p(`Reactivating is instant. Sign back in and you'll pick up exactly where you left off.`)}
    ${cta(`${appUrl}/login`, 'Reactivate my account →')}
  `)

  return emailWrapper(
    intro('💤', 'Account hibernated', `Hi ${userName}, your account has been paused.`) + content,
    'Account hibernated - Owtra'
  )
}