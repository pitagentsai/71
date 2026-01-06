import { NextResponse } from 'next/server'

const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'merchismore.myshopify.com'
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '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'
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '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'
const SHOPIFY_API_VERSION = '2024-10'

// GraphQL mutation to create a checkout
const CREATE_CHECKOUT_MUTATION = `
  mutation checkoutCreate($input: CheckoutCreateInput!) {
    checkoutCreate(input: $input) {
      checkout {
        id
        webUrl
        totalPrice {
          amount
          currencyCode
        }
      }
      checkoutUserErrors {
        field
        message
      }
    }
  }
`

export async function POST(request: Request) {
  try {
    const { items } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      )
    }

    // Check if Storefront API token is configured
    if (!SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
      console.warn('SHOPIFY_STOREFRONT_ACCESS_TOKEN not configured, falling back to cart redirect')
      const checkoutUrl = `https://${SHOPIFY_STORE}/cart`
      return NextResponse.json({ 
        checkoutUrl,
        redirect: checkoutUrl,
      })
    }

    // Transform cart items to Shopify line items format
    // Storefront API requires variant IDs in GID format: gid://shopify/ProductVariant/{variant_id}
    // If variantId is not provided, we need to fetch it from Shopify Admin API
    const lineItems = []
    
    for (const item of items) {
      let variantId = item.variantId
      
      // If no variantId provided, fetch product variants from Admin API
      if (!variantId) {
        try {
          const shopUrl = SHOPIFY_STORE.startsWith('http') 
            ? SHOPIFY_STORE.replace('http://', 'https://')
            : `https://${SHOPIFY_STORE}`
          
          const adminApiUrl = `${shopUrl}/admin/api/${SHOPIFY_API_VERSION}/products/${item.id}.json`
          console.log(`Fetching variant for product ${item.id} from:`, adminApiUrl.replace(SHOPIFY_ACCESS_TOKEN, '***'))
          const adminResponse = await fetch(adminApiUrl, {
            headers: {
              'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
              'Content-Type': 'application/json',
            },
          })
          
          if (adminResponse.ok) {
            const productData = await adminResponse.json()
            const firstVariant = productData.product?.variants?.[0]
            if (firstVariant?.id) {
              variantId = `gid://shopify/ProductVariant/${firstVariant.id}`
            }
          }
        } catch (error) {
          console.error(`Error fetching variant for product ${item.id}:`, error)
        }
      }
      
      // Fallback: try using item.id as variant ID (may not work)
      if (!variantId) {
        variantId = `gid://shopify/ProductVariant/${item.id}`
      }
      
      lineItems.push({
        variantId,
        quantity: item.quantity || 1,
      })
    }
    
    console.log('Line items for checkout:', JSON.stringify(lineItems, null, 2))
    
    if (lineItems.length === 0) {
      console.error('No valid line items to create checkout')
      const checkoutUrl = `https://${SHOPIFY_STORE}/cart`
      return NextResponse.json({ 
        checkoutUrl,
        redirect: checkoutUrl,
        error: 'No valid line items found',
      })
    }

    // For Storefront API, we need to use the .myshopify.com domain, not custom domain
    // Extract base store name if custom domain is used
    let storeDomain = SHOPIFY_STORE
    if (!storeDomain.includes('.myshopify.com')) {
      // If it's a custom domain, try to extract or use the myshopify.com version
      // For now, assume it's merchismore.myshopify.com
      storeDomain = 'merchismore.myshopify.com'
    }
    
    const shopUrl = storeDomain.startsWith('http') 
      ? storeDomain.replace('http://', 'https://')
      : `https://${storeDomain}`
    
    // Storefront API uses /api/{version}/graphql.json endpoint on .myshopify.com domain
    const graphqlUrl = `${shopUrl}/api/${SHOPIFY_API_VERSION}/graphql.json`
    
    console.log('Using Storefront API URL:', graphqlUrl.replace(SHOPIFY_STOREFRONT_ACCESS_TOKEN, '***'))

    console.log('Creating checkout via Storefront API:', graphqlUrl.replace(SHOPIFY_STOREFRONT_ACCESS_TOKEN, '***'))
    console.log('Request body:', JSON.stringify({
      query: CREATE_CHECKOUT_MUTATION,
      variables: {
        input: {
          lineItems,
        },
      },
    }, null, 2))

    console.log('Storefront Access Token (first 10 chars):', SHOPIFY_STOREFRONT_ACCESS_TOKEN.substring(0, 10) + '...')
    
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: CREATE_CHECKOUT_MUTATION,
        variables: {
          input: {
            lineItems,
          },
        },
      }),
    })

    if (!response.ok) {
      console.error('Storefront API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      
      // Fallback to cart redirect if Storefront API fails
      const checkoutUrl = `https://${SHOPIFY_STORE}/cart`
      return NextResponse.json({ 
        checkoutUrl,
        redirect: checkoutUrl,
        error: 'Failed to create checkout via Storefront API, redirecting to cart',
      })
    }

    const data = await response.json()
    
    console.log('Storefront API response:', JSON.stringify(data, null, 2))

    if (data.errors) {
      console.error('GraphQL errors:', data.errors)
      const checkoutUrl = `https://${SHOPIFY_STORE}/cart`
      return NextResponse.json({ 
        checkoutUrl,
        redirect: checkoutUrl,
        error: 'GraphQL errors occurred',
        details: data.errors,
      })
    }

    const checkout = data.data?.checkoutCreate?.checkout
    const errors = data.data?.checkoutCreate?.checkoutUserErrors

    if (errors && errors.length > 0) {
      console.error('Checkout user errors:', errors)
      // Log specific error messages
      errors.forEach((err: any) => {
        console.error(`Checkout error - Field: ${err.field}, Message: ${err.message}`)
      })
      const checkoutUrl = `https://${SHOPIFY_STORE}/cart`
      return NextResponse.json({ 
        checkoutUrl,
        redirect: checkoutUrl,
        error: 'Checkout creation errors',
        details: errors,
      })
    }

    if (!checkout || !checkout.webUrl) {
      console.error('No checkout URL returned')
      const checkoutUrl = `https://${SHOPIFY_STORE}/cart`
      return NextResponse.json({ 
        checkoutUrl,
        redirect: checkoutUrl,
        error: 'No checkout URL returned',
      })
    }

    console.log('Checkout created successfully:', checkout.webUrl)
    return NextResponse.json({ 
      checkoutUrl: checkout.webUrl,
      redirect: checkout.webUrl,
      checkoutId: checkout.id,
      totalPrice: checkout.totalPrice,
    })
  } catch (error) {
    console.error('Error creating checkout:', error)
    const checkoutUrl = `https://${SHOPIFY_STORE}/cart`
    return NextResponse.json({ 
      checkoutUrl,
      redirect: checkoutUrl,
      error: error instanceof Error ? error.message : 'Failed to create checkout',
    })
  }
}




