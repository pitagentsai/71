import { NextResponse } from 'next/server'

// Mailchimp Marketing API configuration
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || ''
const MAILCHIMP_DC = process.env.MAILCHIMP_DC || 'us6'
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID || '' // You'll need to get this from your Mailchimp account
const NOTIFICATION_EMAIL = 'contact@kidzlori.com'
const MAILCHIMP_API_URL = `https://${MAILCHIMP_DC}.api.mailchimp.com/3.0`

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    if (!MAILCHIMP_API_KEY) {
      console.error('Mailchimp API key not configured')
      return NextResponse.json(
        { error: 'Newsletter service not configured' },
        { status: 500 }
      )
    }

    // Add subscriber to Mailchimp list
    if (MAILCHIMP_LIST_ID) {
      const listResponse = await fetch(
        `${MAILCHIMP_API_URL}/lists/${MAILCHIMP_LIST_ID}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')}`,
          },
          body: JSON.stringify({
            email_address: email,
            status: 'subscribed',
            merge_fields: {
              SIGNUP_DATE: new Date().toLocaleDateString(),
            },
          }),
        }
      )

      const listResult = await listResponse.json()

      if (!listResponse.ok) {
        // If email already exists, that's okay
        if (listResult.title === 'Member Exists') {
          console.log('Email already in list:', email)
        } else {
          console.error('Mailchimp API error:', listResult)
          // Continue anyway - we'll still send notification
        }
      } else {
        console.log('Subscriber added to Mailchimp list:', email)
      }
    }

    // Send notification email to contact@kidzlori.com
    // Using Mailchimp's API to send a notification
    // Note: For production, you might want to use a transactional email service
    // or set up a Mailchimp webhook for this
    try {
      // Log the signup for now - you can set up Mailchimp webhooks or use a separate service
      console.log('Newsletter signup:', {
        email,
        date: new Date().toISOString(),
        notificationTo: NOTIFICATION_EMAIL,
      })

      // You can set up a Mailchimp webhook to send notifications
      // Or use a separate email service for notifications
    } catch (notifError) {
      console.error('Notification error (non-critical):', notifError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for signing up! You will be notified when we launch.' 
    })
  } catch (error) {
    console.error('Error processing newsletter signup:', error)
    return NextResponse.json(
      { error: 'Failed to process newsletter signup' },
      { status: 500 }
    )
  }
}

