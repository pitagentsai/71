"use client"

import { useEffect, useRef } from "react"

interface Sphere3DProps {
  className?: string
}

export function Sphere3D({ className = "" }: Sphere3DProps) {
  const sphereRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sphere = sphereRef.current
    if (!sphere) return

    let animationFrame: number
    let rotation = { x: 0, y: 0 }

    const animate = () => {
      // Slower rotation
      rotation.y += 0.002
      rotation.x += 0.001

      sphere.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        ref={sphereRef}
        className="relative w-[600px] h-[600px] md:w-[400px] md:h-[400px] sm:w-[300px] sm:h-[300px]"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Polygonal sphere - white with faceted edges */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 40%, rgba(255, 255, 255, 0.6) 70%, rgba(255, 255, 255, 0.4) 100%)
            `,
            border: '2px solid rgba(255, 255, 255, 0.8)',
            filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.5))',
            opacity: 0.5,
            // Create polygonal effect with CSS
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 85% 60%, 80% 90%, 50% 100%, 20% 90%, 15% 60%, 0% 35%, 20% 10%)',
            WebkitClipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 85% 60%, 80% 90%, 50% 100%, 20% 90%, 15% 60%, 0% 35%, 20% 10%)',
          }}
        />
        {/* Additional faceted layers for depth */}
        <div
          className="absolute inset-[10%] rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            clipPath: 'polygon(50% 5%, 75% 15%, 95% 40%, 80% 65%, 75% 85%, 50% 95%, 25% 85%, 20% 65%, 5% 40%, 25% 15%)',
            WebkitClipPath: 'polygon(50% 5%, 75% 15%, 95% 40%, 80% 65%, 75% 85%, 50% 95%, 25% 85%, 20% 65%, 5% 40%, 25% 15%)',
          }}
        />
      </div>
    </div>
  )
}

