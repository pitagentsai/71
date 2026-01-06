import { NextResponse } from 'next/server'

// Shopify API configuration
const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'qyavex-ue.myshopify.com'
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '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'
const SHOPIFY_API_VERSION = '2025-10' // Latest stable API version

// Construct Shopify API URL
const getShopifyUrl = () => {
  // Ensure the store domain has https:// prefix
  if (SHOPIFY_STORE.startsWith('http://') || SHOPIFY_STORE.startsWith('https://')) {
    return SHOPIFY_STORE.replace('http://', 'https://')
  }
  return `https://${SHOPIFY_STORE}`
}

export async function GET() {
  try {
    // Validate store domain format
    if (!SHOPIFY_STORE || !SHOPIFY_STORE.includes('.myshopify.com')) {
      return NextResponse.json({
        products: [],
        error: 'Invalid Shopify store domain',
        message: 'SHOPIFY_STORE must be a valid Shopify domain (e.g., your-store.myshopify.com)',
      }, { status: 200 })
    }

    const shopUrl = getShopifyUrl()
    const apiUrl = `${shopUrl}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250`
    
    console.log('Fetching products from Shopify:', apiUrl.replace(SHOPIFY_ACCESS_TOKEN, '***'))

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Shopify API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      let errorMessage = `Shopify API error: ${response.status} ${response.statusText}`
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.errors || errorJson.error || errorMessage
      } catch {
        // If not JSON, use the text as is
      }
      
      // Provide helpful error message for 404
      if (response.status === 404) {
        errorMessage = 'Store domain not found. Please verify your SHOPIFY_STORE domain is correct (format: your-store.myshopify.com)'
      }
      
      return NextResponse.json({ 
        products: [], 
        error: errorMessage,
        debug: {
          url: apiUrl.replace(SHOPIFY_ACCESS_TOKEN, '***'),
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText.substring(0, 500),
          storeDomain: SHOPIFY_STORE,
        }
      }, { status: 200 })
    }

    const data = await response.json()
    console.log(`Shopify API response: ${data.products?.length || 0} products found`)
    
    // Filter out hidden/draft/archived products - only show active, published products
    const visibleProducts = (data.products || []).filter((product: any) => {
      // Exclude draft, archived products, and products without published_at
      return product.status === 'active' && product.published_at !== null
    })
    
    console.log(`Filtered to ${visibleProducts.length} visible products (excluded ${(data.products?.length || 0) - visibleProducts.length} hidden products)`)
    
    // Transform Shopify products to our format
    const products = visibleProducts.map((product: any) => {
      // Get the first variant for price
      const variant = product.variants?.[0]
      const price = variant?.price ? parseFloat(variant.price) : 0
      
      // Get the first image
      const image = product.images?.[0]?.src || product.image?.src || null
      
      // Get product description (HTML or plain text)
      const description = product.body_html || product.description || 'DESCRIPTION_HERE'
      
      return {
        id: product.id || 0,
        name: product.title || 'PRODUCT',
        price: price > 0 ? `$${price.toFixed(2)}` : '$0.00',
        description: description.replace(/<[^>]*>/g, '').substring(0, 200) || 'DESCRIPTION_HERE', // Strip HTML and limit length
        image: image,
        sku: variant?.sku || product.variants?.[0]?.sku || '',
        stock: variant?.inventory_quantity || product.variants?.[0]?.inventory_quantity || 0,
        handle: product.handle, // Shopify product handle for URLs
        variants: product.variants?.map((v: any) => ({
          id: v.id,
          price: parseFloat(v.price),
          title: v.title,
          inventory_quantity: v.inventory_quantity,
        })) || [],
      }
    })

    console.log(`Successfully transformed ${products.length} products`)
    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products from Shopify:', error)
    return NextResponse.json({ 
      products: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 200 })
  }
}

