"use client"

import { useEffect, useRef } from "react"

interface MatrixBackgroundProps {
  className?: string
}

export function MatrixBackground({ className = "" }: MatrixBackgroundProps) {
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

    // Matrix text pattern
    const textPattern = "717171717171717171717171717171"
    const patternArray = textPattern.split("")

    // Column properties - more columns with less spacing for more lines
    const fontSize = 20
    const columnSpacing = fontSize * 2 // Closer spacing for more columns
    const columns = Math.floor(canvas.width / columnSpacing)
    const drops: number[] = []
    
    // ADJUSTABLE VALUES FOR EDGE POSITIONING
    const leftEdgeOffset = -canvas.width * 0.10 // Push left columns further left (negative = more left)
    const rightEdgeOffset = canvas.width * 0.10 // Push right columns further right (positive = more right)
    const edgePushStrength = 0.4 // How much to push columns to edges (0-1, higher = more edge)
    const centerStart = columns * 0.25 // Start of center area (25% from left)
    const centerEnd = columns * 0.75 // End of center area (75% from left)

    // Initialize drops - heavily favor edges, avoid center
    for (let i = 0; i < columns; i++) {
      // Calculate distance from center (0 = center, 1 = edge)
      const center = columns / 2
      const distanceFromCenter = Math.abs(i - center) / (columns / 2)
      
      // Much more dramatic gradient - heavily favor edges, completely clear center
      // Activate columns in the outer 35% on each side for many more lines
      const isInOuterLeft = i < columns * 0.35
      const isInOuterRight = i > columns * 0.65
      const isInCenter = i >= columns * 0.4 && i <= columns * 0.6 // Center exclusion
      
      let activationProbability = 0
      if (isInOuterLeft || isInOuterRight) {
        activationProbability = 1.0 // All columns active on edges
      } else if (isInCenter) {
        activationProbability = 0 // Completely inactive in center
      } else {
        // Gradual transition zones - higher probability for more lines
        activationProbability = distanceFromCenter > 0.6 ? 0.95 : 0.7
      }
      
      if (Math.random() < activationProbability) {
        drops[i] = Math.random() * -100
      } else {
        drops[i] = -1000 // Inactive
      }
    }

    // Animation function
    const draw = () => {
      // Clear canvas with transparency to show video behind
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Dim white text
      ctx.font = `${fontSize}px monospace`

      // Draw characters
      for (let i = 0; i < drops.length; i++) {
        // Skip inactive columns
        if (drops[i] < -50) continue

        // Get character from pattern based on drop position
        const patternIndex = Math.floor(drops[i]) % patternArray.length
        const text = patternArray[patternIndex]
        
        // Calculate X position - push columns to edges
        const centerX = canvas.width / 2
        const baseX = i * columnSpacing
        const distanceFromCenter = (baseX - centerX) / centerX // -1 to 1
        
        // Apply edge push - stronger push for columns further from center
        let xPosition = baseX
        if (distanceFromCenter < 0) {
          // Left side - push further left
          xPosition = baseX + (leftEdgeOffset * Math.abs(distanceFromCenter) * edgePushStrength)
        } else {
          // Right side - push further right
          xPosition = baseX + (rightEdgeOffset * Math.abs(distanceFromCenter) * edgePushStrength)
        }
        
        // Draw current character
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)"
        ctx.fillText(text, xPosition, drops[i] * fontSize)
        
        // Draw a few characters above to create visible trail with proper spacing
        const trailLength = 8 // Number of characters to show in trail
        for (let j = 1; j <= trailLength; j++) {
          const trailY = (drops[i] - j) * fontSize
          if (trailY < 0) continue // Skip if above screen
          
          const trailPatternIndex = (Math.floor(drops[i]) - j) % patternArray.length
          const trailText = patternArray[trailPatternIndex < 0 ? patternArray.length + trailPatternIndex : trailPatternIndex]
          
          // Fade opacity as we go up the trail
          const trailOpacity = 0.08 * (1 - j / (trailLength + 1)) * 0.8
          ctx.fillStyle = `rgba(255, 255, 255, ${trailOpacity})`
          ctx.fillText(trailText, xPosition, trailY)
        }

        // Reset drop if it reaches bottom - ensure it's fully off screen
        if (drops[i] * fontSize > canvas.height + fontSize) {
          drops[i] = Math.random() * -100
        }

        // Move drop down - slightly faster
        drops[i] += 0.3
      }
    }

    // Animation loop - slightly faster update
    const interval = setInterval(draw, 170)

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ mixBlendMode: "normal", zIndex: 2 }}
    />
  )
}

