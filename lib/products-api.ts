const API_KEY = 'efc2a31a5f520da0878bc7f8d7d054d596690b7eb9f1962538fae19d7bdb3b7c'
const BASE_URL = 'https://panel-g.baselinker.com'

export interface Product {
  id: number
  name: string
  price: string
  description: string
  image?: string
  sku?: string
  stock?: number
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    // Baselinker API endpoint for getting products
    const response = await fetch(`${BASE_URL}/webhooks/shop_connectors2.php?platform=shoper_rest&whkey=6f0fac7eca2fe5a80f7aff6877de8cf7`, {
      method: 'GET',
      headers: {
        'X-BLToken': API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform the API response to match our Product interface
    // Adjust this based on the actual API response structure
    if (data.products && Array.isArray(data.products)) {
      return data.products.map((product: any) => ({
        id: product.product_id || product.id,
        name: product.name || product.product_name || 'PRODUCT',
        price: product.price ? `$${parseFloat(product.price).toFixed(2)}` : '$0.00',
        description: product.description || product.short_description || 'DESCRIPTION_HERE',
        image: product.images?.[0] || product.image,
        sku: product.sku,
        stock: product.stock,
      }))
    }

    // If response structure is different, try alternative parsing
    if (Array.isArray(data)) {
      return data.map((product: any) => ({
        id: product.product_id || product.id,
        name: product.name || product.product_name || 'PRODUCT',
        price: product.price ? `$${parseFloat(product.price).toFixed(2)}` : '$0.00',
        description: product.description || product.short_description || 'DESCRIPTION_HERE',
        image: product.images?.[0] || product.image,
        sku: product.sku,
        stock: product.stock,
      }))
    }

    return []
  } catch (error) {
    console.error('Error fetching products:', error)
    // Return empty array on error, or you could throw to handle it in the component
    return []
  }
}

