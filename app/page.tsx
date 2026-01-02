"use client"

import { useState, useEffect, useRef } from "react"
import { ImageCanvas } from "@/components/image-canvas"
import { Instagram, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { CartModal } from "@/components/cart-modal"
import { useCart } from "@/contexts/cart-context"
import { MatrixBackground } from "@/components/matrix-background"
import { Rotator3D } from "@/components/3d-rotator"
import { TeaserLock } from "@/components/teaser-lock"

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
  const [parallaxOffset, setParallaxOffset] = useState(0)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [products, setProducts] = useState<Array<{ id: number; name: string; price: string; description: string }>>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const productsSectionRef = useRef<HTMLElement>(null)
  const { getTotalItems } = useCart()

  // Check if site is already unlocked (from localStorage)
  useEffect(() => {
    const unlocked = localStorage.getItem('siteUnlocked') === 'true'
    setIsUnlocked(unlocked)
  }, [])

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true)
        const response = await fetch('/api/products')
        const data = await response.json()
        
        console.log('Products API response:', data)
        
        if (data.debug) {
          console.log('API Debug Info:', data.debug)
          console.log('Response keys:', data.debug.responseKeys)
          console.log('Raw response sample:', JSON.stringify(data.debug.rawResponse).substring(0, 1000))
        }
        
        if (data.products && Array.isArray(data.products)) {
          console.log(`Loaded ${data.products.length} products`)
          setProducts(data.products)
        } else {
          console.warn('No products found in response:', data)
          if (data.error) {
            console.error('API error:', data.error)
          }
          setProducts([])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    }

    if (isUnlocked) {
      fetchProducts()
    }
  }, [isUnlocked])

  const handleUnlock = () => {
    setIsUnlocked(true)
    localStorage.setItem('siteUnlocked', 'true')
  }

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

  // Parallax effect for products section background
  useEffect(() => {
    const handleScroll = () => {
      if (!productsSectionRef.current) return

      const section = productsSectionRef.current
      const rect = section.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Calculate how far the section has scrolled into view
      // When section top is at window top, offset is 0
      // As we scroll down, offset increases
      const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height)
      
      // Apply parallax offset (negative to move up as we scroll down)
      const offset = scrollProgress * 100 // Adjust multiplier for parallax strength
      setParallaxOffset(offset)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])


  // Show teaser lock if not unlocked
  if (!isUnlocked) {
    return <TeaserLock onUnlock={handleUnlock} />
  }

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-end h-14">
            <button 
              onClick={() => setCartOpen(true)}
              className="font-mono font-light text-white text-sm tracking-wider hover:opacity-70 transition-opacity flex items-center relative mt-2 mr-4 md:mr-0 md:-mr-8 p-2 -m-2 md:p-0 md:m-0"
              aria-label="Shopping Cart"
            >
              <div className="pixelated w-6 h-6 md:w-5 md:h-5 flex items-center justify-center">
                <ShoppingCart className="w-full h-full" />
              </div>
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
        <MatrixBackground />
        <div className="w-full max-w-4xl mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center">
            {imageError && (
              <div className="text-red-500">{imageError}</div>
            )}
            {!uploadedImage && !imageError && (
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {uploadedImage && (
              <div className="flex flex-col items-center w-full">
                <div className="flex justify-center w-full px-4">
                  <div className="inline-block max-w-full md:max-w-none" style={{ maxWidth: '90vw' }}>
                    <Rotator3D>
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
                    </Rotator3D>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const productsSection = document.getElementById('products-section')
                    if (productsSection) {
                      const rect = productsSection.getBoundingClientRect()
                      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
                      const elementTop = rect.top + scrollTop
                      const elementHeight = productsSection.offsetHeight
                      const windowHeight = window.innerHeight
                      // Center the section in the viewport
                      const offset = elementTop - (windowHeight / 2) + (elementHeight / 2)
                      window.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' })
                    }
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

      {/* Products Section with Extended Background */}
      <div className="relative overflow-hidden bg-black">
        {/* Parallax Background Image - Extended to Footer */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/Rectangle.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: `translateY(${parallaxOffset}px)`,
            willChange: 'transform'
          }}
        />
        {/* Black gradient overlay at top edge */}
        <div 
          className="absolute top-0 left-0 right-0 z-0 pointer-events-none"
          style={{
            height: '200px',
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0.7) 60%, rgba(0, 0, 0, 0.3) 80%, rgba(0, 0, 0, 0) 100%)',
          }}
        />
        
        {/* Products Section */}
        <section 
          ref={productsSectionRef}
          id="products-section" 
          className="py-48 relative z-10"
        >
          <div className="w-full max-w-6xl mx-auto px-4">
            <div className="mb-24 mt-24 text-center flex justify-center">
              <img 
                src="/Rectangle (1).png" 
                alt="Products" 
                className="h-16 w-auto brightness-0 invert"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-32">
              {productsLoading ? (
                <div className="col-span-full text-center text-white/60 font-mono text-sm tracking-wider py-12">
                  LOADING PRODUCTS...
                </div>
              ) : products.length === 0 ? (
                <div className="col-span-full text-center text-white/60 font-mono text-sm tracking-wider py-12">
                  NO PRODUCTS AVAILABLE
                </div>
              ) : (
                products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="p-8 font-mono font-light transition-all duration-300 cursor-pointer group block relative backdrop-blur-md border border-white/30"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <div className="space-y-4 relative z-10">
                    <div className="text-sm tracking-wider text-white">
                      [{String(product.id).padStart(3, '0')}]
                    </div>
                    <h3 className="text-xl font-light tracking-wider uppercase text-white">
                      {product.name}
                    </h3>
                    <p className="text-sm text-white/80">
                      {product.description}
                    </p>
                    <div className="pt-6 border-t border-white/30">
                      <div className="text-lg font-light tracking-wider text-white">
                        {product.price}
                      </div>
                    </div>
                  </div>
                </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-transparent py-12 relative z-10">
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
      </div>

      <CartModal open={cartOpen} onOpenChange={setCartOpen} />
    </main>
  )
}
