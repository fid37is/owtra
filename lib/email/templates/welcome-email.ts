// lib/email/templates/welcome-email.ts
import { emailWrapper, intro, body, cta, steps, p, getEmailVars } from './_base'

export function buildWelcomeEmailHtml(userName: string): string {
  const { appUrl } = getEmailVars()

  const content = body(`
    ${p(`I'm genuinely glad you're here. Owtra was built from a frustration I know all too well - juggling a job search across dozens of companies, losing track of where I applied, missing follow-ups, and blanking in interviews because I hadn't done enough research. Spreadsheets just weren't cutting it.`)}
    ${p(`So we built something better: a place to keep track of every application you send out, get AI-powered insights on your fit, and walk into every interview prepared.`)}
    <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.7px;">Here's where to start</p>
    ${steps([
      {
        title: 'Log your first application',
        description: 'Add the job you applied for - company, role, date - and keep everything in one place.',
      },
      {
        title: 'Review your fit score',
        description: 'See how well your profile matches the role and what gaps to address.',
      },
      {
        title: 'Prep for your interview',
        description: 'Get tailored questions and talking points the moment you land an interview.',
      },
    ])}
    ${cta(`${appUrl}/dashboard`, 'Go to my dashboard →')}
    <p style="margin:28px 0 2px;font-size:14px;color:#475569;">Wishing you the best in your search,</p>
    <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">
      Fidelis Agba &nbsp;<span style="font-weight:400;color:#94a3b8;font-size:13px;"> - CEO, Owtra</span>
    </p>
  `)

  return emailWrapper(
    intro('👋', `Welcome, ${userName}`, 'A personal note from Fidelis, CEO of Owtra') + content,
    'Welcome to Owtra'
  )
}