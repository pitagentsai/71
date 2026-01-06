"use client"

import { useEffect, forwardRef, useImperativeHandle, useRef, useState } from "react"
import { smoothNoise } from "@/lib/noise"

interface ImageCanvasProps {
  image: HTMLImageElement
  halftoneSize: number
  contrast: number
  accentColor: string
  mouseRadius: number
  repulsionStrength: number
  returnSpeed: number
  accentProbability: number
  sizeVariation: number
}

interface DotData {
  x: number
  y: number
  baseX: number
  baseY: number
  baseSize: number
  brightness: number
  isAccent: boolean
  sizeMultiplier: number
  twinklePhase: number
  twinkleSpeed: number
  vx: number
  vy: number
}

interface TrailPoint {
  x: number
  y: number
  timestamp: number
  strength: number
}

export const ImageCanvas = forwardRef<HTMLCanvasElement, ImageCanvasProps>(
  (
    {
      image,
      halftoneSize,
      contrast,
      accentColor,
      mouseRadius,
      repulsionStrength,
      returnSpeed,
      accentProbability,
      sizeVariation,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const dotsRef = useRef<DotData[]>([])
    const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000 })
    const animationFrameRef = useRef<number>()
    const [isHovering, setIsHovering] = useState(false)
    const isFirstMoveRef = useRef(true)
    const lastMoveTimeRef = useRef(0)
    const mouseTrailRef = useRef<TrailPoint[]>([])
    const fadeFactorRef = useRef(1) // Track fade factor continuously

    useImperativeHandle(ref, () => canvasRef.current!)

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()

      // Since ctx.scale(dpr, dpr) is used, all drawing happens in display space
      const newX = e.clientX - rect.left
      const newY = e.clientY - rect.top

      lastMoveTimeRef.current = Date.now()

      if (isFirstMoveRef.current) {
        mouseRef.current.x = newX
        mouseRef.current.y = newY
        mouseRef.current.prevX = newX
        mouseRef.current.prevY = newY
        isFirstMoveRef.current = false
        return
      }

      mouseRef.current.prevX = mouseRef.current.x
      mouseRef.current.prevY = mouseRef.current.y
      mouseRef.current.x = newX
      mouseRef.current.y = newY

      const velX = newX - mouseRef.current.prevX
      const velY = newY - mouseRef.current.prevY
      const speed = Math.sqrt(velX * velX + velY * velY)

      const distance = speed
      const steps = Math.max(1, Math.ceil(distance / 10)) // Changed from 5 to 10 pixels

      for (let i = 0; i < steps; i++) {
        const t = i / steps
        const interpX = mouseRef.current.prevX + velX * t
        const interpY = mouseRef.current.prevY + velY * t

        mouseTrailRef.current.push({
          x: interpX,
          y: interpY,
          timestamp: Date.now(),
          strength: Math.min(speed / 10, 1),
        })
      }

      const now = Date.now()
      mouseTrailRef.current = mouseTrailRef.current.filter((point) => now - point.timestamp < 150)
    }

    const handleMouseEnter = () => {
      setIsHovering(true)
      lastMoveTimeRef.current = Date.now()
    }

    const handleMouseLeave = () => {
      setIsHovering(false)
    }

    useEffect(() => {
      if (!canvasRef.current || !image) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return

      // Responsive sizing for mobile
      const isMobile = window.innerWidth < 768
      const MAX_WIDTH = isMobile ? Math.min(window.innerWidth * 0.95, 600) : 720 // Much larger on mobile
      const MAX_HEIGHT = isMobile ? Math.min(window.innerHeight * 0.6, 800) : 480 // Much larger on mobile

      // Calculate scale to fit within both width and height constraints
      const scaleX = MAX_WIDTH / image.width
      const scaleY = MAX_HEIGHT / image.height
      const scale = Math.min(1, scaleX, scaleY) // Use smallest scale to fit within both constraints

      const dpr = window.devicePixelRatio || 1
      const displayWidth = image.width * scale
      const displayHeight = image.height * scale

      canvas.width = displayWidth * dpr
      canvas.height = displayHeight * dpr
      // Set CSS size to display dimensions
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`

      // Scale context to work in display space
      ctx.scale(dpr, dpr)
      ctx.imageSmoothingEnabled = false

      // Draw image in display space
      ctx.drawImage(image, 0, 0, displayWidth, displayHeight)

      // Get image data from the scaled canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        // Apply contrast with clamping to prevent extreme values
        data[i] = Math.max(0, Math.min(255, ((data[i] / 255 - 0.5) * contrast + 0.5) * 255))
        data[i + 1] = Math.max(0, Math.min(255, ((data[i + 1] / 255 - 0.5) * contrast + 0.5) * 255))
        data[i + 2] = Math.max(0, Math.min(255, ((data[i + 2] / 255 - 0.5) * contrast + 0.5) * 255))
      }

      const dots: DotData[] = []

      const adjustedHalftoneSize = Math.max(2, halftoneSize * scale)

      for (let y = 0; y < displayHeight; y += adjustedHalftoneSize) {
        for (let x = 0; x < displayWidth; x += adjustedHalftoneSize) {
          // Sample from the high-res canvas
          const sampleX = Math.floor(x * dpr)
          const sampleY = Math.floor(y * dpr)
          const i = (sampleY * canvas.width + sampleX) * 4
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3

          const dotSize = (brightness / 255) * adjustedHalftoneSize * 0.6

          if (dotSize > 0.5) {
            const centerX = x + adjustedHalftoneSize / 2
            const centerY = y + adjustedHalftoneSize / 2

            const sizeMultiplier = 1 + (Math.random() - 0.5) * sizeVariation
            const isAccent = Math.random() < accentProbability && brightness > 150

            dots.push({
              x: centerX,
              y: centerY,
              baseX: centerX,
              baseY: centerY,
              baseSize: dotSize,
              brightness,
              isAccent,
              sizeMultiplier,
              twinklePhase: Math.random() * Math.PI * 2,
              twinkleSpeed: 0.02 + Math.random() * 0.03,
              vx: 0,
              vy: 0,
            })
          }
        }
      }

      dotsRef.current = dots

      const animate = () => {
        ctx.clearRect(0, 0, displayWidth, displayHeight)

        const timeSinceLastMove = Date.now() - lastMoveTimeRef.current
        const isMouseMoving = timeSinceLastMove < 100

        // fadeFactorRef.current is always 1 now, no fading
        fadeFactorRef.current = 1

        if (!isMouseMoving) {
          mouseTrailRef.current = []
        }

        const time = Date.now() * 0.001

        const fadeOutFactor = 1

        dots.forEach((dot) => {
          // Keep particles at their base positions - no mouse interaction
          dot.x = dot.baseX
          dot.y = dot.baseY
          dot.vx = 0
          dot.vy = 0

          const currentSize = dot.baseSize * dot.sizeMultiplier

          ctx.globalAlpha = 1
          ctx.fillStyle = dot.isAccent ? accentColor : "#ffffff"

          ctx.beginPath()
          ctx.arc(dot.x, dot.y, currentSize / 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        })

        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animate()

      // Mouse event listeners removed - no interaction

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }, [
      image,
      halftoneSize,
      contrast,
      accentColor,
      mouseRadius,
      repulsionStrength,
      returnSpeed,
      accentProbability,
      sizeVariation,
      isHovering,
    ])

    return (
      <div className="flex justify-center items-center w-full">
        <canvas 
          ref={canvasRef} 
          className="block mx-auto"
          style={{ 
            display: 'block',
            backgroundColor: 'transparent',
            margin: '0 auto'
          }}
        />
      </div>
    )
  },
)

ImageCanvas.displayName = "ImageCanvas"
