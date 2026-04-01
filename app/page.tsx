"use client"

import { useState, useEffect, useRef } from "react"
import { ImageCanvas } from "@/components/image-canvas"
import { Instagram } from "lucide-react"
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
  const [showVideoFallback, setShowVideoFallback] = useState(false)
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

  useEffect(() => {
    // Force a fallback to local video after a short attempt window.
    // Some YouTube embeds report load while still showing an error page.
    const timeoutId = setTimeout(() => {
      setShowVideoFallback(true)
    }, 2500)

    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section - Full viewport height */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <img
          src="/dziewczyny.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover fade-in-video"
          style={{
            pointerEvents: 'none',
            filter: "brightness(0.88)",
          }}
        />

        {/* Frame viewfinder guides */}
        <div className="absolute inset-[7%] z-[3] border border-white/5 pointer-events-none" />
        <div className="absolute inset-[7%] z-[3] pointer-events-none">
          <div className="absolute left-0 top-0 h-7 w-7 border-l border-t border-white/20" />
          <div className="absolute right-0 top-0 h-7 w-7 border-r border-t border-white/20" />
          <div className="absolute left-0 bottom-0 h-7 w-7 border-l border-b border-white/20" />
          <div className="absolute right-0 bottom-0 h-7 w-7 border-r border-b border-white/20" />
        </div>

        {/* Viewfinder HUD */}
        <div className="absolute inset-[7%] z-[4] pointer-events-none text-white/50 opacity-40 font-mono">
          <div className="viewfinder-topbar absolute left-0 top-0 right-0 flex items-center justify-between text-[10px] tracking-[0.2em]">
            <span>LIVE FEED</span>
            <span>4K 24FPS</span>
            <span>BAT 92%</span>
          </div>

          <div className="absolute inset-0">
            <div className="viewfinder-third-v absolute left-1/3 top-0 h-full w-px -translate-x-1/2" />
            <div className="viewfinder-third-v absolute left-2/3 top-0 h-full w-px -translate-x-1/2" />
            <div className="viewfinder-third-h absolute left-0 top-1/3 h-px w-full -translate-y-1/2" />
            <div className="viewfinder-third-h absolute left-0 top-2/3 h-px w-full -translate-y-1/2" />
          </div>

          <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-1/2 top-0 h-10 w-px -translate-x-1/2 bg-white/50" />
            <div className="absolute left-1/2 bottom-0 h-10 w-px -translate-x-1/2 bg-white/50" />
            <div className="absolute left-0 top-1/2 h-px w-10 -translate-y-1/2 bg-white/50" />
            <div className="absolute right-0 top-1/2 h-px w-10 -translate-y-1/2 bg-white/50" />
          </div>

          <div className="absolute left-0 top-1/2 -translate-y-1/2 viewfinder-scale">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 viewfinder-scale">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="viewfinder-bottombar absolute bottom-0 left-0 right-0 flex items-center justify-between text-[10px] tracking-[0.2em]">
            <span>ISO 800</span>
            <span>1/125</span>
            <span>F2.8</span>
            <span>+0.3EV</span>
            <span>00:03:12</span>
          </div>
        </div>

        {/* Bottom edge status ticker */}
        <div className="viewfinder-ticker absolute bottom-0 left-0 right-0 z-[5] pointer-events-none">
          <div className="viewfinder-ticker-track">
            <span>ENEMY CORP SALES ARE CLOSED</span>
            <span>SEE YOU SOON ENEMY</span>
            <span>NEXT DROP: TBA</span>
            <span>FOLLOW @KIDZLORI FOR UPDATES</span>
            <span>ENEMY CORP SALES ARE CLOSED</span>
            <span>SEE YOU SOON ENEMY</span>
            <span>NEXT DROP: TBA</span>
            <span>FOLLOW @KIDZLORI FOR UPDATES</span>
          </div>
        </div>

        {/* Centered Logo */}
        <div className="relative z-10">
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
      </section>

      {/* YouTube Section */}
      <section className="bg-black min-h-screen flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {showVideoFallback ? (
              <>
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  src="/bg-video.mov"
                  autoPlay
                  loop
                  muted
                  playsInline
                  disablePictureInPicture
                  controlsList="nodownload noplaybackrate noremoteplayback"
                />
                <a
                  href="https://www.youtube.com/@setteunocom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 bg-black/55 border border-white/20 px-4 py-2 text-[11px] tracking-[0.16em] text-white/85 hover:text-white transition-colors"
                >
                  OPEN YOUTUBE
                </a>
              </>
            ) : (
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed?listType=user_uploads&list=setteunocom"
                title="setteunocom channel uploads"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onError={() => {
                  setShowVideoFallback(true)
                }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-transparent py-4 md:py-6 relative z-10 flex-shrink-0 fade-in-footer">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] md:text-xs tracking-[0.22em] text-white/65 pointer-events-none">
            WWW.SETTEUNO.COM
          </div>
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
