import { NextResponse } from 'next/server'

// Mailchimp Marketing API configuration
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || ''
const MAILCHIMP_DC = process.env.MAILCHIMP_DC || 'us6'
const MAILCHIMP_API_URL = `https://${MAILCHIMP_DC}.api.mailchimp.com/3.0`

export async function GET() {
  try {
    if (!MAILCHIMP_API_KEY) {
      return NextResponse.json(
        { error: 'Mailchimp API key not configured. Set MAILCHIMP_API_KEY in .env.local' },
        { status: 500 }
      )
    }

    // Test the connection using the ping endpoint
    const response = await fetch(`${MAILCHIMP_API_URL}/ping`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')}`,
      },
    })

    const result = await response.json()

    if (response.ok && result.health_status) {
      return NextResponse.json({
        success: true,
        message: 'Mailchimp API connection successful!',
        health_status: result.health_status,
        dc: MAILCHIMP_DC,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Mailchimp API connection failed',
        details: result,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Mailchimp test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test Mailchimp connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}





