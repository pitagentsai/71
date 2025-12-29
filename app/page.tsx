"use client"

import { useState, useEffect } from "react"
import { ImageCanvas } from "@/components/image-canvas"
import { Instagram, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { CartModal } from "@/components/cart-modal"
import { useCart } from "@/contexts/cart-context"
import { MatrixBackground } from "@/components/matrix-background"
import { ParticleBackground } from "@/components/particle-background"

// Preset values - always use these exact values
const PRESET_HALFTONE_SIZE = 4
const PRESET_CONTRAST = 1.5
const PRESET_ACCENT_COLOR = "#ffffff"
const PRESET_MOUSE_RADIUS = 80
const PRESET_REPULSION_STRENGTH = 0.2
const PRESET_RETURN_SPEED = 0.18
const PRESET_ACCENT_PROBABILITY = 0.09
const PRESET_SIZE_VARIATION = 0.3

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const { getTotalItems } = useCart()

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      console.log("Image loaded successfully", img.width, img.height)
      setUploadedImage(img)
      setImageError(null)
    }
    img.onerror = (error) => {
      console.error("Error loading image:", error)
      setImageError("Failed to load image. Please check the console.")
    }
    img.src = "/1 (9).png"
  }, [])

  // Sample products data - replace with your actual products
  const products = [
    { id: 1, name: "PRODUCT_001", price: "$99.00", description: "DESCRIPTION_HERE" },
    { id: 2, name: "PRODUCT_002", price: "$149.00", description: "DESCRIPTION_HERE" },
    { id: 3, name: "PRODUCT_003", price: "$79.00", description: "DESCRIPTION_HERE" },
    { id: 4, name: "PRODUCT_004", price: "$199.00", description: "DESCRIPTION_HERE" },
    { id: 5, name: "PRODUCT_005", price: "$129.00", description: "DESCRIPTION_HERE" },
    { id: 6, name: "PRODUCT_006", price: "$89.00", description: "DESCRIPTION_HERE" },
  ]

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-end h-14">
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

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center bg-black py-20 pt-24 relative overflow-hidden">
        <ParticleBackground />
        <MatrixBackground />
        <div className="w-full max-w-4xl mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center">
            {imageError && (
              <div className="text-red-500">{imageError}</div>
            )}
            {!uploadedImage && !imageError && (
              <div className="text-white">Loading image...</div>
            )}
            {uploadedImage && (
              <div className="flex flex-col items-center w-full">
                <div className="flex justify-center w-full">
                  <div className="inline-block">
                    <ImageCanvas
                      image={uploadedImage}
                      halftoneSize={PRESET_HALFTONE_SIZE}
                      contrast={PRESET_CONTRAST}
                      accentColor={PRESET_ACCENT_COLOR}
                      mouseRadius={PRESET_MOUSE_RADIUS}
                      repulsionStrength={PRESET_REPULSION_STRENGTH}
                      returnSpeed={PRESET_RETURN_SPEED}
                      accentProbability={PRESET_ACCENT_PROBABILITY}
                      sizeVariation={PRESET_SIZE_VARIATION}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const productsSection = document.getElementById('products-section')
                    productsSection?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="font-mono font-light text-white/40 text-base tracking-[0.3em] hover:text-white/70 transition-colors cursor-pointer mt-16"
                >
                  SHOP
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products-section" className="py-20 bg-black relative overflow-hidden">
        <ParticleBackground />
        <div className="w-full max-w-6xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-mono font-light text-white mb-12 text-center tracking-wider">
            PRODUCTS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="border-2 border-white bg-black p-6 font-mono font-light hover:bg-white hover:text-black transition-all duration-200 cursor-pointer group block"
              >
                <div className="space-y-3">
                  <div className="text-sm tracking-wider text-white group-hover:text-black">
                    [{String(product.id).padStart(3, '0')}]
                  </div>
                  <h3 className="text-xl font-light tracking-wider uppercase text-white group-hover:text-black">
                    {product.name}
                  </h3>
                  <p className="text-sm text-white/70 group-hover:text-black/70">
                    {product.description}
                  </p>
                  <div className="pt-4 border-t border-white group-hover:border-black">
                    <div className="text-lg font-light tracking-wider text-white group-hover:text-black">
                      {product.price}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-4">
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
                href="https://instagram.com" 
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
