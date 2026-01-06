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
import { EffectControls } from "@/components/effect-controls"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Preset values - initial defaults
const PRESET_HALFTONE_SIZE = 3
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
  const [fxControlsOpen, setFxControlsOpen] = useState(false)
  const [parallaxOffset, setParallaxOffset] = useState(0)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [products, setProducts] = useState<Array<{ id: number; name: string; price: string; description: string }>>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [showGlitch, setShowGlitch] = useState(false)
  const productsSectionRef = useRef<HTMLElement>(null)
  const glitchTimeoutsRef = useRef<NodeJS.Timeout[]>([])
  const { getTotalItems } = useCart()

  // Effect parameters state
  const [halftoneSize, setHalftoneSize] = useState(PRESET_HALFTONE_SIZE)
  const [contrast, setContrast] = useState(PRESET_CONTRAST)
  const [accentColor, setAccentColor] = useState(PRESET_ACCENT_COLOR)
  const [mouseRadius, setMouseRadius] = useState(PRESET_MOUSE_RADIUS)
  const [repulsionStrength, setRepulsionStrength] = useState(PRESET_REPULSION_STRENGTH)
  const [returnSpeed, setReturnSpeed] = useState(PRESET_RETURN_SPEED)
  const [accentProbability, setAccentProbability] = useState(PRESET_ACCENT_PROBABILITY)
  const [sizeVariation, setSizeVariation] = useState(PRESET_SIZE_VARIATION)

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
      // Trigger glitch effect on load
      setShowGlitch(true)
      // Remove glitch class after animation completes
      setTimeout(() => {
        setShowGlitch(false)
      }, 150)
    }
    img.onerror = (error) => {
      console.error("Error loading image:", error)
      setImageError("Failed to load image. Please check the console.")
    }
    img.src = "/1 (9).png"
  }, [])

  // Random glitch effect system
  useEffect(() => {
    if (!uploadedImage) return

    const scheduleNextGlitch = () => {
      // Random delay between 2-8 seconds
      const minDelay = 2000
      const maxDelay = 8000
      const randomDelay = minDelay + Math.random() * (maxDelay - minDelay)
      
      const delayTimeout = setTimeout(() => {
        setShowGlitch(true)
        // Remove glitch class after animation completes
        const removeTimeout = setTimeout(() => {
          setShowGlitch(false)
          // Schedule next glitch
          scheduleNextGlitch()
        }, 150)
        glitchTimeoutsRef.current.push(removeTimeout)
      }, randomDelay)
      
      glitchTimeoutsRef.current.push(delayTimeout)
    }

    // Start scheduling random glitches after initial load glitch completes
    const initialTimeout = setTimeout(() => {
      scheduleNextGlitch()
    }, 150)
    glitchTimeoutsRef.current.push(initialTimeout)

    return () => {
      glitchTimeoutsRef.current.forEach(id => clearTimeout(id))
      glitchTimeoutsRef.current = []
    }
  }, [uploadedImage])

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
        <div className="w-full max-w-[95vw] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-end h-14 gap-4">
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
      <section className="min-h-screen flex items-center justify-center bg-black py-12 md:py-20 pt-20 md:pt-24 relative overflow-hidden">
        <MatrixBackground />
        {/* Fixed Map Background - Above Matrix - Stays locked to viewport */}
        <div 
          className="fixed inset-0 z-[1] map-bg-fixed"
          style={{
            backgroundImage: "url('/Map 1.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.17,
            transition: 'none',
            animation: 'none',
            willChange: 'auto',
            pointerEvents: 'none',
          }}
        />
        <div className="w-full max-w-4xl mx-auto px-0 sm:px-6 relative z-10 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center w-full">
            {imageError && (
              <div className="text-red-500 text-center text-sm px-4">{imageError}</div>
            )}
            {!uploadedImage && !imageError && (
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {uploadedImage && (
              <div className="flex flex-col items-center justify-center w-full">
                <div className="flex justify-center items-center w-full overflow-hidden">
                  <div className={`flex justify-center items-center w-full ${showGlitch ? 'glitch-on-load' : ''}`} style={{ maxWidth: '100vw' }}>
                    <Rotator3D>
                <ImageCanvas
                  image={uploadedImage}
                  halftoneSize={halftoneSize}
                  contrast={contrast}
                  accentColor={accentColor}
                  mouseRadius={mouseRadius}
                  repulsionStrength={repulsionStrength}
                  returnSpeed={returnSpeed}
                  accentProbability={accentProbability}
                  sizeVariation={sizeVariation}
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
                  className="font-mono font-light text-white/40 text-sm md:text-base tracking-[0.3em] hover:text-white/70 transition-colors cursor-pointer mt-8 md:mt-16"
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
          className="py-24 md:py-48 relative z-10"
        >
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
            <div className="mb-16 md:mb-24 mt-12 md:mt-24 text-center flex justify-center">
              <img 
                src="/Rectangle (1).png" 
                alt="Products" 
                className="h-20 md:h-24 w-auto brightness-0 invert"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12 mb-16 md:mb-32">
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
                  className="p-4 md:p-8 font-mono font-light transition-all duration-300 cursor-pointer group block relative backdrop-blur-md border border-white/30"
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
                  <div className="space-y-3 md:space-y-4 relative z-10">
                    {/* Product Image */}
                    {product.image && (
                      <div className="w-full aspect-square overflow-hidden mb-2 md:mb-4">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="text-xs md:text-sm tracking-wider text-white">
                      [{String(product.id).padStart(3, '0')}]
                    </div>
                    <h3 className="text-base md:text-xl font-light tracking-wider uppercase text-white">
                      {product.name}
                    </h3>
                    <div className="pt-4 md:pt-6 border-t border-white/30">
                      <div className="text-base md:text-lg font-light tracking-wider text-white">
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
        <footer className="bg-transparent py-8 md:py-12 relative z-10">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/rysowane.png" 
                alt="Logo" 
                className="h-6 md:h-8 w-auto brightness-0 invert"
              />
            </div>
            <div className="flex items-center gap-4 md:gap-6 font-mono font-light text-white text-xs md:text-sm tracking-wider">
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
      </div>

      <CartModal open={cartOpen} onOpenChange={setCartOpen} />

      {/* FX Controls Dialog */}
      <Dialog open={fxControlsOpen} onOpenChange={setFxControlsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white font-mono tracking-wider">FX CONTROLS</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <EffectControls
              halftoneSize={halftoneSize}
              contrast={contrast}
              accentColor={accentColor}
              mouseRadius={mouseRadius}
              repulsionStrength={repulsionStrength}
              returnSpeed={returnSpeed}
              accentProbability={accentProbability}
              sizeVariation={sizeVariation}
              onHalftoneSizeChange={setHalftoneSize}
              onContrastChange={setContrast}
              onAccentColorChange={setAccentColor}
              onMouseRadiusChange={setMouseRadius}
              onRepulsionStrengthChange={setRepulsionStrength}
              onReturnSpeedChange={setReturnSpeed}
              onAccentProbabilityChange={setAccentProbability}
              onSizeVariationChange={setSizeVariation}
            />
        </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
