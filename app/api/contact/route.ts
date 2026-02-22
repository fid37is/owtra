/**
 * API Route: Contact Form
 * POST /api/contact
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // 1. Save to Supabase
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({ name, email, subject, message })

    if (dbError) {
      console.error('Failed to save contact submission:', dbError)
      return NextResponse.json(
        { error: 'Failed to save your message. Please try again.' },
        { status: 500 }
      )
    }

    // 2. Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Notify your team
    await resend.emails.send({
      from: 'Owtra Contact <noreply@owtra.com>', // update with your verified domain
      to: process.env.CONTACT_EMAIL || 'hello@owtra.com',
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1769ff; margin-bottom: 24px;">New Contact Message</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #40514e; width: 80px;">Name</td>
              <td style="padding: 8px 0; color: #40514e;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #40514e;">Email</td>
              <td style="padding: 8px 0; color: #40514e;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #40514e;">Subject</td>
              <td style="padding: 8px 0; color: #40514e;">${subject}</td>
            </tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #1769ff;">
            <p style="margin: 0; color: #40514e; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `,
    })

    // Auto-reply to sender
    await resend.emails.send({
      from: 'Owtra <noreply@owtra.com>',
      to: email,
      subject: "We received your message — we'll be in touch soon",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1769ff;">Thanks for reaching out, ${name}!</h2>
          <p style="color: #40514e; line-height: 1.6;">
            We've received your message and will get back to you within 1–2 business days.
          </p>
          <div style="margin: 24px 0; padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #1769ff;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #40514e;">Your message:</p>
            <p style="margin: 0; color: #666; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #40514e;">— The Owtra Team</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}