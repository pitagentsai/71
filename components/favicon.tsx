"use client"

import { useEffect } from "react"

export function Favicon() {
  useEffect(() => {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
    existingLinks.forEach(link => link.remove())

    // Create favicon using favicon_2.png - resize to make it smaller
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 64 // Smaller size for favicon
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Draw image scaled down
        ctx.drawImage(img, 0, 0, size, size)
        
        // Convert to data URL and set as favicon
        const dataUrl = canvas.toDataURL('image/png')
        link.href = dataUrl
        document.head.appendChild(link)
      }
    }
    img.onerror = () => {
      // Fallback to original
      link.href = '/favicon_2.png'
      document.head.appendChild(link)
    }
    img.src = '/favicon_2.png'
  }, [])

  return null
}

