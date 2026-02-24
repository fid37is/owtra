// app/api/send-notification-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  sendAccountHibernatedEmail,
  sendAccountDeletedEmail,
  sendWelcomeEmail,
} from '@/lib/email/notification-service'

export async function POST(request: NextRequest) {
  try {
    const { type, email, userName, deletionDate } = await request.json()

    if (!type || !email || !userName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let result

    switch (type) {
      case 'hibernated':
        console.log('Sending hibernation email to:', email)
        result = await sendAccountHibernatedEmail(email, userName)
        break

      case 'deleted':
        if (!deletionDate) {
          return NextResponse.json({ error: 'deletionDate required' }, { status: 400 })
        }
        console.log('Sending deletion email to:', email)
        result = await sendAccountDeletedEmail(email, userName, deletionDate)
        break

      case 'welcome':
        console.log('Sending welcome email to:', email)
        result = await sendWelcomeEmail(email, userName)
        break

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    if (!result.success) {
      console.error('Email service error:', result.error)
      throw result.error
    }

    console.log('✅ Notification email sent successfully')
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('API send-notification-email error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}