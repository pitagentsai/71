import { NextResponse } from 'next/server'

// MailerLite API configuration
// Note: The token should be set in .env.local as MAILERLITE_API_TOKEN for production
// The token below is a fallback - make sure it doesn't have extra text appended
const DEFAULT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiMTZhMmE5ZjM4ZTRjNzVlZjdiZDQzOGM2ZjI1YjMyOWEzNTk3YjExZTI5M2JkMmRkNzkxZWFhYmJhYmExNWFlN2U1ZTBmODFhZGEzZTg2NGIiLCJpYXQiOjE3Njc3MjA2NzYuNTE2OTc4LCJuYmYiOjE3Njc3MjA2NzYuNTE2OTgxLCJleHAiOjQ5MjMzOTQyNzYuNTA5NzM4LCJzdWIiOiIyMDM2NTExIiwic2NvcGVzIjpbXX0.A2wB2edx4koAH3TUrJx-7o0NqAudnpL1YVx49oyOYVyt5HLXa-2hai1Xxm3vmakwwZ85yPNTMjgfQUzu-55_TMJCrY8QQwFvwZto-tjhGKkyR_lU7YxUiPlTLwCVKUYyh5oyB5t1pgwQ8i4xZYwV2_5jD_cveqQY9RDx9iRkTN6ROqHpxeKUZBYf6QdC_S1sMLlt1VIrwBTd6fH4oO_UYNXPLKNN_Nfo2wGCtR8MSxUq75cmcchGLM5l6HMFaZGX3Yhht0apHU3UuFfIOSaaKuBAZBaV_sQA1SgIpIL1SLjsXvZCTziGVOEwnYlth0HsTSO2KtPhbwwnTQOFAwefTPK4MkJvZcw1P7PEFASWCyaRldZM_X2e1veCu69tHnimNcPGXQnRc6FwGm7161rzlvSl-2FMsyFe9VoKOPSCJY7riqkjO71HJGMAOcuveiH_Mgo5vv8-T16Tjb4GKipcRJgLP1wjDG2UiJXUWvn0drkAEnmLfZu-l-CO4Eklh-JcUW0KZkBhj_Ve5olAdu_dfepsrjRwhU2RQ3yHWBBM4MxiOCxN7Ih2X02NCg-cibNkIpGb397n-6vxgi4A7bVj0dCyNHjnoZe8I3o-Hm7AgFrMoPdxS4WcxcHEWEXqyAujYyoEboCDowpp_DxZj1b_xu_EIzCGjUKIukS44zuo-do'
const MAILERLITE_API_TOKEN = process.env.MAILERLITE_API_TOKEN || DEFAULT_TOKEN
const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api'
const NOTIFICATION_EMAIL = 'contact@kidzlori.com'

export async function POST(request: Request) {
  try {
    let body
    try {
      body = await request.json()
      console.log('Received request body:', body)
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const { email } = body

    if (!email) {
      console.error('Email is missing from request body')
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      console.error('Invalid email format:', email)
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    if (!MAILERLITE_API_TOKEN) {
      console.error('MailerLite API token not configured')
      return NextResponse.json(
        { error: 'Newsletter service not configured' },
        { status: 500 }
      )
    }

    // Add subscriber to MailerLite
    try {
      console.log('Attempting to add subscriber to MailerLite:', email)
      console.log('API URL:', `${MAILERLITE_API_URL}/subscribers`)
      console.log('API Token (first 20 chars):', MAILERLITE_API_TOKEN.substring(0, 20) + '...')
      
      const response = await fetch(`${MAILERLITE_API_URL}/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${MAILERLITE_API_TOKEN}`,
        },
        body: JSON.stringify({
          email: email,
          status: 'active',
        }),
      })

      console.log('MailerLite API Response Status:', response.status)
      console.log('MailerLite API Response Headers:', Object.fromEntries(response.headers.entries()))
      
      let result: any = {}
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json()
          console.log('MailerLite API Response Body:', JSON.stringify(result, null, 2))
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError)
          const text = await response.text()
          console.log('Response text:', text)
        }
      } else {
        const text = await response.text()
        console.log('Non-JSON Response:', text)
        result = { message: text }
      }

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          console.error('MailerLite API authentication failed:', {
            status: response.status,
            error: result
          })
          return NextResponse.json(
            { 
              error: 'Newsletter service authentication failed',
              details: 'Please check the API token configuration',
              status: response.status
            },
            { status: 500 }
          )
        }
        
        // If email already exists, that's okay
        if (response.status === 422 || response.status === 409 || 
            result.message?.includes('already') || 
            result.message?.includes('duplicate') ||
            result.message?.includes('exists')) {
          console.log('Email already in MailerLite:', email)
          return NextResponse.json({ 
            success: true, 
            message: 'You are already subscribed! Thank you.' 
          })
        } else {
          console.error('MailerLite API error:', {
            status: response.status,
            statusText: response.statusText,
            error: result
          })
          return NextResponse.json(
            { 
              error: 'Failed to add subscriber to newsletter',
              details: result.message || result.error || 'Unknown error',
              status: response.status
            },
            { status: response.status >= 500 ? 500 : 400 }
          )
        }
      } else {
        console.log('Subscriber successfully added to MailerLite:', email)
      }
    } catch (apiError: any) {
      console.error('MailerLite API request failed:', {
        error: apiError.message,
        stack: apiError.stack,
        name: apiError.name
      })
      return NextResponse.json(
        { 
          error: 'Failed to connect to newsletter service',
          details: apiError.message || 'Network error'
        },
        { status: 500 }
      )
    }

    // Log the signup
    console.log('Newsletter signup:', {
      email,
      date: new Date().toISOString(),
      notificationTo: NOTIFICATION_EMAIL,
    })

    // Note: You can set up MailerLite webhooks to receive notifications
    // when new subscribers are added (subscriber.created event)

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for showing interest in ENEMY CORP. You will be 71.' 
    })
  } catch (error) {
    console.error('Error processing newsletter signup:', error)
    return NextResponse.json(
      { error: 'Failed to process newsletter signup' },
      { status: 500 }
    )
  }
}

