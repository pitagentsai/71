import { NextResponse } from 'next/server'

const DEFAULT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiMTZhMmE5ZjM4ZTRjNzVlZjdiZDQzOGM2ZjI1YjMyOWEzNTk3YjExZTI5M2JkMmRkNzkxZWFhYmJhYmExNWFlN2U1ZTBmODFhZGEzZTg2NGIiLCJpYXQiOjE3Njc3MjA2NzYuNTE2OTc4LCJuYmYiOjE3Njc3MjA2NzYuNTE2OTgxLCJleHAiOjQ5MjMzOTQyNzYuNTA5NzM4LCJzdWIiOiIyMDM2NTExIiwic2NvcGVzIjpbXX0.A2wB2edx4koAH3TUrJx-7o0NqAudnpL1YVx49oyOYVyt5HLXa-2hai1Xxm3vmakwwZ85yPNTMjgfQUzu-55_TMJCrY8QQwFvwZto-tjhGKkyR_lU7YxUiPlTLwCVKUYyh5oyB5t1pgwQ8i4xZYwV2_5jD_cveqQY9RDx9iRkTN6ROqHpxeKUZBYf6QdC_S1sMLlt1VIrwBTd6fH4oO_UYNXPLKNN_Nfo2wGCtR8MSxUq75cmcchGLM5l6HMFaZGX3Yhht0apHU3UuFfIOSaaKuBAZBaV_sQA1SgIpIL1SLjsXvZCTziGVOEwnYlth0HsTSO2KtPhbwwnTQOFAwefTPK4MkJvZcw1P7PEFASWCyaRldZM_X2e1veCu69tHnimNcPGXQnRc6FwGm7161rzlvSl-2FMsyFe9VoKOPSCJY7riqkjO71HJGMAOcuveiH_Mgo5vv8-T16Tjb4GKipcRJgLP1wjDG2UiJXUWvn0drkAEnmLfZu-l-CO4Eklh-JcUW0KZkBhj_Ve5olAdu_dfepsrjRwhU2RQ3yHWBBM4MxiOCxN7Ih2X02NCg-cibNkIpGb397n-6vxgi4A7bVj0dCyNHjnoZe8I3o-Hm7AgFrMoPdxS4WcxcHEWEXqyAujYyoEboCDowpp_DxZj1b_xu_EIzCGjUKIukS44zuo-do'
const MAILERLITE_API_TOKEN = process.env.MAILERLITE_API_TOKEN || DEFAULT_TOKEN
const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api'

export async function GET() {
  try {
    // Test 1: Check API token validity by fetching account info or groups
    console.log('Testing MailerLite API connection...')
    
    // Try to fetch groups to verify API token works
    const groupsResponse = await fetch(`${MAILERLITE_API_URL}/groups`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_TOKEN}`,
      },
    })

    const groupsResult = await groupsResponse.json()
    
    console.log('Groups API Response Status:', groupsResponse.status)
    console.log('Groups API Response:', JSON.stringify(groupsResult, null, 2))

    // Test 2: Try to add a test subscriber
    const testEmail = `test-${Date.now()}@example.com`
    const subscriberResponse = await fetch(`${MAILERLITE_API_URL}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_TOKEN}`,
      },
      body: JSON.stringify({
        email: testEmail,
        status: 'active',
      }),
    })

    const subscriberResult = await subscriberResponse.json()
    
    console.log('Subscriber API Response Status:', subscriberResponse.status)
    console.log('Subscriber API Response:', JSON.stringify(subscriberResult, null, 2))

    return NextResponse.json({
      success: true,
      tests: {
        groups: {
          status: groupsResponse.status,
          ok: groupsResponse.ok,
          data: groupsResult,
        },
        subscriber: {
          status: subscriberResponse.status,
          ok: subscriberResponse.ok,
          data: subscriberResult,
          testEmail: testEmail,
        },
      },
    })
  } catch (error: any) {
    console.error('MailerLite test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}

