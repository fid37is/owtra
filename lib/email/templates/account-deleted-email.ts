// lib/email/templates/account-deleted-email.ts
import { emailWrapper, intro, body, cta, details, p, getEmailVars } from './_base'

export function buildAccountDeletedEmailHtml(userName: string, deletionDate: string): string {
  const { appUrl } = getEmailVars()

  const content = body(`
    ${p(`Your Owtra account has been scheduled for permanent deletion. You have <strong style="color:#0f172a;">30 days</strong> to change your mind - sign back in before the deletion date and your account will be fully restored, including all the applications you've logged and your research.`)}
    ${details([
      { label: 'Scheduled deletion date', value: deletionDate },
      { label: 'Grace period', value: '30 days' },
    ])}
    ${p(`After this date, everything will be permanently and irreversibly removed.`)}
    ${cta(`${appUrl}/login`, 'Cancel deletion & sign back in →')}
  `)

  return emailWrapper(
    intro('🗑️', 'Account deletion scheduled', `Hi ${userName}, your account will be deleted on ${deletionDate}.`) + content,
    'Account deletion scheduled - Owtra'
  )
}