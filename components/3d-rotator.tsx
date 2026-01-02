"use client"

import { useRef, useState, useEffect, ReactNode } from "react"

interface Rotator3DProps {
  children: ReactNode
}

export function Rotator3D({ children }: Rotator3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const lastPositionRef = useRef({ x: 0, y: 0 })

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    lastPositionRef.current = { x: e.clientX, y: e.clientY }
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    setIsDragging(true)
    lastPositionRef.current = { x: touch.clientX, y: touch.clientY }
  }

  // Global mouse/touch handlers
  useEffect(() => {
    if (!isDragging) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - lastPositionRef.current.x
      const deltaY = e.clientY - lastPositionRef.current.y

      setRotation((prev) => ({
        x: Math.max(-30, Math.min(30, prev.x - deltaY * 0.5)),
        y: prev.y + deltaX * 0.5,
      }))

      lastPositionRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault()
        const touch = e.touches[0]
        const deltaX = touch.clientX - lastPositionRef.current.x
        const deltaY = touch.clientY - lastPositionRef.current.y

        setRotation((prev) => ({
          x: Math.max(-30, Math.min(30, prev.x - deltaY * 0.5)),
          y: prev.y + deltaX * 0.5,
        }))

        lastPositionRef.current = { x: touch.clientX, y: touch.clientY }
      }
    }

    const handleGlobalTouchEnd = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
    window.addEventListener('touchend', handleGlobalTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
      window.removeEventListener('touchmove', handleGlobalTouchMove)
      window.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [isDragging])

  // Smooth return to center when not dragging
  useEffect(() => {
    if (!isDragging) {
      const interval = setInterval(() => {
        setRotation((prev) => {
          const newX = prev.x * 0.95
          const newY = prev.y * 0.95
          // Stop animation when values are very small
          if (Math.abs(newX) < 0.1 && Math.abs(newY) < 0.1) {
            return { x: 0, y: 0 }
          }
          return { x: newX, y: newY }
        })
      }, 16)

      return () => clearInterval(interval)
    }
  }, [isDragging])

  return (
    <div
      ref={containerRef}
      className="cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(0)`,
          transformStyle: 'preserve-3d',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  )
}

