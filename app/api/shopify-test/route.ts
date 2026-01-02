import { NextResponse } from 'next/server'

// Shopify API configuration
const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'merchismore.myshopify.com'
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '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'
const SHOPIFY_API_VERSION = '2024-10'

// Get Shopify URL
const getShopifyUrl = () => {
  if (SHOPIFY_STORE.startsWith('http://') || SHOPIFY_STORE.startsWith('https://')) {
    return SHOPIFY_STORE.replace('http://', 'https://')
  }
  return `https://${SHOPIFY_STORE}`
}

export async function GET() {
  try {
    const baseUrl = getShopifyUrl()
    
    // Test 1: Try to get shop info
    const shopInfoUrl = `${baseUrl}/admin/api/${SHOPIFY_API_VERSION}/shop.json`
    console.log('Testing Shopify URL:', shopInfoUrl.replace(SHOPIFY_ACCESS_TOKEN, '***'))
    
    const shopResponse = await fetch(shopInfoUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    })
    
    if (!shopResponse.ok) {
      const errorText = await shopResponse.text()
      return NextResponse.json({
        success: false,
        message: 'Failed to connect to Shopify',
        error: {
          status: shopResponse.status,
          statusText: shopResponse.statusText,
          body: errorText,
        },
        url: baseUrl,
      }, { status: 500 })
    }
    
    const shopData = await shopResponse.json()
    
    // Test 2: Try to get products
    const productsUrl = `${baseUrl}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=5`
    const productsResponse = await fetch(productsUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    })
    
    if (productsResponse.ok) {
      const productsData = await productsResponse.json()
      return NextResponse.json({
        success: true,
        message: 'Shopify connection successful!',
        shop: shopData.shop,
        productsCount: productsData.products?.length || 0,
        sampleProduct: productsData.products?.[0] || null,
        url: baseUrl,
      })
    } else {
      const errorText = await productsResponse.text()
      return NextResponse.json({
        success: true,
        message: 'Shop info retrieved, but products endpoint failed',
        shop: shopData.shop,
        productsError: {
          status: productsResponse.status,
          statusText: productsResponse.statusText,
          body: errorText,
        },
        url: baseUrl,
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error connecting to Shopify',
      error: error instanceof Error ? error.message : 'Unknown error',
      url: getShopifyUrl(),
    }, { status: 500 })
  }
}

