import { NextResponse } from 'next/server'

const API_KEY = '8b2f564b2f02f1b7449872bab4489020b9e71017b6767a1508892844b51aa6b0'
const BASE_URL = 'https://api.baselinker.com'

export async function GET() {
  try {
    // Baselinker API endpoint for getting products
    const params = new URLSearchParams({
      method: 'getProducts',
      parameters: JSON.stringify({})
    })
    
    const response = await fetch(`${BASE_URL}/connector.php`, {
      method: 'POST',
      headers: {
        'X-BLToken': API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return NextResponse.json({ products: [], error: `API error: ${response.status}` }, { status: 200 })
    }

    const data = await response.json()
    console.log('Full Baselinker API response:', JSON.stringify(data, null, 2))
    
    // Transform the API response
    // Baselinker API typically returns: { status: "SUCCESS", products: [...] }
    let products = []
    
    // Check for different possible response structures
    if (data.status === 'SUCCESS' && data.products) {
      // Handle Baselinker products format - products might be an object with IDs as keys
      const productList = Array.isArray(data.products) ? data.products : Object.values(data.products)
      products = productList.map((product: any) => ({
        id: product.product_id || product.id || parseInt(product.product_id) || 0,
        name: product.name || product.product_name || product.ean || 'PRODUCT',
        price: product.price ? `$${parseFloat(product.price).toFixed(2)}` : '$0.00',
        description: product.description || product.short_description || product.text_fields?.description || 'DESCRIPTION_HERE',
        image: product.images?.[0]?.url || product.images?.[0] || product.image || product.thumbnail_url,
        sku: product.sku || product.ean,
        stock: product.quantity || product.stock,
      }))
    } else if (data.status === 'SUCCESS' && data.inventory_products) {
      // Alternative: inventory_products field
      const productList = Array.isArray(data.inventory_products) ? data.inventory_products : Object.values(data.inventory_products)
      products = productList.map((product: any) => ({
        id: product.product_id || product.id || parseInt(product.product_id) || 0,
        name: product.name || product.product_name || product.ean || 'PRODUCT',
        price: product.price ? `$${parseFloat(product.price).toFixed(2)}` : '$0.00',
        description: product.description || product.short_description || 'DESCRIPTION_HERE',
        image: product.images?.[0]?.url || product.images?.[0] || product.image,
        sku: product.sku || product.ean,
        stock: product.quantity || product.stock,
      }))
    } else if (data.products && Array.isArray(data.products)) {
      products = data.products.map((product: any) => ({
        id: product.product_id || product.id || parseInt(product.product_id) || 0,
        name: product.name || product.product_name || 'PRODUCT',
        price: product.price ? `$${parseFloat(product.price).toFixed(2)}` : '$0.00',
        description: product.description || product.short_description || 'DESCRIPTION_HERE',
        image: product.images?.[0]?.url || product.images?.[0] || product.image,
        sku: product.sku,
        stock: product.quantity || product.stock,
      }))
    } else if (Array.isArray(data)) {
      products = data.map((product: any) => ({
        id: product.product_id || product.id || parseInt(product.product_id) || 0,
        name: product.name || product.product_name || 'PRODUCT',
        price: product.price ? `$${parseFloat(product.price).toFixed(2)}` : '$0.00',
        description: product.description || product.short_description || 'DESCRIPTION_HERE',
        image: product.images?.[0]?.url || product.images?.[0] || product.image,
        sku: product.sku,
        stock: product.quantity || product.stock,
      }))
    }

    console.log(`Fetched ${products.length} products`)
    console.log('Response structure keys:', Object.keys(data))
    return NextResponse.json({ products, debug: { rawResponse: data, responseKeys: Object.keys(data) } })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ products: [], error: error instanceof Error ? error.message : 'Unknown error' }, { status: 200 })
  }
}

