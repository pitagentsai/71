"use client"

import { useEffect, useRef } from "react"

interface DottedSphereProps {
  className?: string
}

export function DottedSphere({ className = "" }: DottedSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 600
    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.4

    // Set canvas size
    canvas.width = size
    canvas.height = size
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    let rotation = { x: 0, y: 0 }

    const drawSphere = () => {
      // Clear canvas
      ctx.clearRect(0, 0, size, size)

      // Generate dots on sphere surface
      const dots: Array<{ x: number; y: number; z: number; size: number }> = []
      const dotCount = 800
      const dotRadius = 1.5

      for (let i = 0; i < dotCount; i++) {
        // Spherical coordinates
        const theta = Math.random() * Math.PI * 2 // Longitude
        const phi = Math.acos(2 * Math.random() - 1) // Latitude

        // Convert to 3D coordinates
        const x = radius * Math.sin(phi) * Math.cos(theta)
        const y = radius * Math.sin(phi) * Math.sin(theta)
        const z = radius * Math.cos(phi)

        // Rotate around Y axis
        const cosY = Math.cos(rotation.y)
        const sinY = Math.sin(rotation.y)
        const rotatedX = x * cosY - z * sinY
        const rotatedZ = x * sinY + z * cosY

        // Rotate around X axis
        const cosX = Math.cos(rotation.x)
        const sinX = Math.sin(rotation.x)
        const finalY = rotatedZ * sinX + y * cosX
        const finalZ = rotatedZ * cosX - y * sinX

        // Project to 2D (perspective projection)
        const distance = 800
        const scale = distance / (distance - finalZ)
        const screenX = centerX + rotatedX * scale
        const screenY = centerY + finalY * scale

        // Only draw dots that are visible (in front)
        if (finalZ > -radius) {
          const dotSize = dotRadius * scale
          dots.push({ x: screenX, y: screenY, z: finalZ, size: dotSize })
        }
      }

      // Sort dots by Z depth (back to front)
      dots.sort((a, b) => a.z - b.z)

      // Draw dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      dots.forEach(dot => {
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Update rotation
      rotation.y += 0.002
      rotation.x += 0.001
    }

    const animate = () => {
      drawSphere()
      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-[600px] h-[600px] md:w-[400px] md:h-[400px] sm:w-[300px] sm:h-[300px]"
        style={{
          opacity: 0.4,
        }}
      />
    </div>
  )
}


