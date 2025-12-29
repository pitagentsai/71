"use client"

import { useEffect, useRef } from "react"

interface ParticleBackgroundProps {
  className?: string
}

export function ParticleBackground({ className = "" }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Particle system
    const particles: Array<{
      x: number
      y: number
      z: number
      size: number
      speed: number
      opacity: number
    }> = []

    const particleCount = 50

    // Initialize particles with depth (z-axis)
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 1000, // Depth from 0 to 1000
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.3 + 0.1,
      })
    }

    // Animation function
    const draw = () => {
      // Clear with fade
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particles.forEach((particle) => {
        // Move particle based on depth (closer = faster)
        particle.y += particle.speed * (1 - particle.z / 1000)

        // Reset if off screen
        if (particle.y > canvas.height) {
          particle.y = 0
          particle.x = Math.random() * canvas.width
          particle.z = Math.random() * 1000
        }

        // Calculate size and opacity based on depth
        const depthScale = 1 - particle.z / 1000 // 0 (far) to 1 (close)
        const size = particle.size * (0.5 + depthScale * 0.5)
        const opacity = particle.opacity * (0.3 + depthScale * 0.7)

        // Draw particle
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Animation loop
    const interval = setInterval(draw, 50)

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ mixBlendMode: "normal" }}
    />
  )
}

