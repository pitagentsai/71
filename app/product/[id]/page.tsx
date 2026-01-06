"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Instagram, ShoppingCart, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CartModal } from "@/components/cart-modal"
import { useCart } from "@/contexts/cart-context"

interface Product {
  id: number
  name: string
  price: string
  description: string
  fullDescription?: string
  image?: string | null
}

export default function ProductPage() {
  const params = useParams()
  const productId = parseInt(params.id as string)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const { addToCart, getTotalItems } = useCart()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products')
        const data = await response.json()
        
        if (data.products && Array.isArray(data.products)) {
          const foundProduct = data.products.find((p: Product) => p.id === productId)
          if (foundProduct) {
            setProduct({
              ...foundProduct,
              fullDescription: foundProduct.fullDescription || foundProduct.description,
            })
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="font-mono font-light text-center">
            <p className="text-xl">LOADING...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="font-mono font-light text-center">
            <p className="text-xl mb-4">PRODUCT NOT FOUND</p>
            <Link href="/" className="underline hover:opacity-70">
              RETURN TO HOME
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link 
              href="/"
              className="font-mono font-light text-white text-sm tracking-wider hover:opacity-70 transition-opacity flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>BACK</span>
            </Link>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img 
                src="/rysowane.png" 
                alt="Logo" 
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
            <button 
              onClick={() => setCartOpen(true)}
              className="font-mono font-light text-white text-sm tracking-wider hover:opacity-70 transition-opacity flex items-center relative mt-2"
              style={{ marginRight: '-2rem' }}
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-mono w-5 h-5 flex items-center justify-center border-2 border-black">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Product Content */}
      <section className="pt-24 pb-20">
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Product Image - Left Side */}
            <div className="w-full">
              {product.image ? (
                <div className="aspect-square border-2 border-white overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-white/10 border-2 border-white flex items-center justify-center">
                  <span className="text-white/50 text-sm tracking-wider">NO IMAGE</span>
                </div>
              )}
            </div>

            {/* Product Info - Right Side */}
            <div className="font-mono font-light space-y-6">
              {/* Product Header */}
              <div className="space-y-4">
                <div className="text-sm tracking-wider text-white/70">
                  [{String(product.id).padStart(3, '0')}]
                </div>
                <h1 className="text-3xl font-light tracking-wider uppercase">
                  {product.name}
                </h1>
                <div className="text-2xl font-light tracking-wider">
                  {product.price}
                </div>
              </div>

              {/* Product Description */}
              <div className="space-y-4 pt-6 border-t-2 border-white">
                <h2 className="text-xl font-light tracking-wider uppercase">DESCRIPTION</h2>
                <p className="text-sm text-white/70 leading-relaxed">
                  {product.fullDescription || product.description}
                </p>
              </div>

              {/* Add to Cart Button */}
              <div className="pt-4">
                <button 
                  onClick={() => {
                    if (product) {
                      addToCart({ id: product.id, name: product.name, price: product.price })
                      setCartOpen(true)
                    }
                  }}
                  className="w-full border-2 border-white bg-black text-white font-mono font-light text-sm tracking-wider py-4 hover:bg-white hover:text-black transition-all duration-200 uppercase"
                >
                  ADD TO CART
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-transparent py-4">
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/rysowane.png" 
                alt="Logo" 
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
            <div className="flex items-center gap-6 font-mono font-light text-white text-sm tracking-wider">
              <span>© 2026</span>
              <a 
                href="https://www.instagram.com/sette71uno/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <CartModal open={cartOpen} onOpenChange={setCartOpen} />
    </main>
  )
}

