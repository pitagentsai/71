import { NextResponse } from 'next/server'

const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'merchismore.myshopify.com'
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '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'
const SHOPIFY_API_VERSION = '2024-10'

export async function POST(request: Request) {
  try {
    const { items } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      )
    }

    // Create a checkout URL - redirect to Shopify store cart
    // For a full implementation, you'd create a checkout session via Shopify API
    // For now, redirect to the store's cart page
    const checkoutUrl = `https://${SHOPIFY_STORE}/cart`

    return NextResponse.json({ 
      checkoutUrl,
      redirect: checkoutUrl,
    })
  } catch (error) {
    console.error('Error creating checkout:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    )
  }
}




