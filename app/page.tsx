"use client"

import { useState, useEffect, useRef } from "react"
import { ImageCanvas } from "@/components/image-canvas"
import { Instagram } from "lucide-react"
import { MatrixBackground } from "@/components/matrix-background"
import { Rotator3D } from "@/components/3d-rotator"
import { EffectControls } from "@/components/effect-controls"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Preset values - initial defaults
const PRESET_HALFTONE_SIZE = 2
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
  const [fxControlsOpen, setFxControlsOpen] = useState(false)
  const [showGlitch, setShowGlitch] = useState(false)
  const glitchTimeoutsRef = useRef<NodeJS.Timeout[]>([])

  // Effect parameters state
  const [halftoneSize, setHalftoneSize] = useState(PRESET_HALFTONE_SIZE)
  const [contrast, setContrast] = useState(PRESET_CONTRAST)
  const [accentColor, setAccentColor] = useState(PRESET_ACCENT_COLOR)
  const [mouseRadius, setMouseRadius] = useState(PRESET_MOUSE_RADIUS)
  const [repulsionStrength, setRepulsionStrength] = useState(PRESET_REPULSION_STRENGTH)
  const [returnSpeed, setReturnSpeed] = useState(PRESET_RETURN_SPEED)
  const [accentProbability, setAccentProbability] = useState(PRESET_ACCENT_PROBABILITY)
  const [sizeVariation, setSizeVariation] = useState(PRESET_SIZE_VARIATION)

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

  return (
    <main className="h-screen overflow-hidden bg-black text-white flex flex-col">
      {/* Navbar with Canvas in center */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent pt-4">
        <div className="w-full max-w-[95vw] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center">
            {imageError && (
              <div className="text-red-500 text-center text-sm px-4">{imageError}</div>
            )}
            {!uploadedImage && !imageError && (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {uploadedImage && (
              <div className={`fade-in-logo ${showGlitch ? 'glitch-on-load' : ''}`}>
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
            )}
          </div>
        </div>
      </nav>

      {/* Video Background - Fixed to cover entire viewport */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover fade-in-video"
        style={{
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <source src="/bg-video.mov" type="video/mp4" />
      </video>

      {/* Fixed Map Background - Covers entire viewport */}
      <div 
        className="fixed inset-0 fade-in-map"
        style={{
          backgroundImage: "url('/Map 1.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 70%',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col bg-transparent relative overflow-hidden">
        {/* Matrix rain - z-index 2 */}
        <div className="fade-in-matrix absolute inset-0">
          <MatrixBackground />
        </div>

        {/* SHOP link in center */}
        <div className="flex-1 flex items-center justify-center relative z-10 w-full">
          <a 
            href="https://www.kidzlori.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="fade-in-shop text-white text-3xl sm:text-4xl md:text-5xl font-light tracking-widest text-center hover:scale-[1.15]"
            style={{ fontFamily: 'var(--font-roboto), sans-serif' }}
          >
            SHOP
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-transparent py-4 md:py-6 relative z-10 flex-shrink-0 fade-in-footer">
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
