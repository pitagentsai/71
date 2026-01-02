"use client"

import { useState, useEffect } from "react"

interface TeaserLockProps {
  onUnlock: () => void
}

export function TeaserLock({ onUnlock }: TeaserLockProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  // Load the particle image for background
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setBackgroundImage(img)
    }
    img.src = "/1 (9).png"
  }, [])

  // Set countdown target date to March 1st, 2026
  useEffect(() => {
    const targetDate = new Date()
    targetDate.setFullYear(2026, 2, 1) // March 1, 2026 (month is 0-indexed: 0=Jan, 1=Feb, 2=Mar)
    targetDate.setHours(0, 0, 0, 0) // Set to midnight
    const targetTime = targetDate.getTime()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const difference = targetTime - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(data.message || "Thank you! You'll be notified when we launch.")
        setEmail("") // Clear the email field
      } else {
        setError(data.error || "Failed to sign up. Please try again.")
      }
    } catch (error) {
      console.error('Error submitting email:', error)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "M4B5S6") {
      setError("")
      onUnlock()
    } else {
      setError("Incorrect password")
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      {/* Blurred particle image background */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: "url('/1 (9).png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(20px)',
          transform: 'scale(1.2)',
          pointerEvents: 'none',
        }}
      />
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="text-center px-4 max-w-md w-full relative z-10">
        {/* Countdown */}
        <div className="mb-12">
          <div className="mb-8 flex justify-center">
            <img
              src="/Rectangle (1).png"
              alt="setteuno"
              className="h-16 w-auto brightness-0 invert"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-white font-mono text-3xl font-light">{String(timeLeft.days).padStart(2, '0')}</div>
              <div className="text-white/60 font-mono text-xs mt-2 tracking-wider">DAYS</div>
            </div>
            <div className="text-center">
              <div className="text-white font-mono text-3xl font-light">{String(timeLeft.hours).padStart(2, '0')}</div>
              <div className="text-white/60 font-mono text-xs mt-2 tracking-wider">HOURS</div>
            </div>
            <div className="text-center">
              <div className="text-white font-mono text-3xl font-light">{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div className="text-white/60 font-mono text-xs mt-2 tracking-wider">MIN</div>
            </div>
            <div className="text-center">
              <div className="text-white font-mono text-3xl font-light">{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div className="text-white/60 font-mono text-xs mt-2 tracking-wider">SEC</div>
            </div>
          </div>
        </div>

        {/* Email Input */}
        <form onSubmit={handleEmailSubmit} className="mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError("")
              setSuccess("")
            }}
            placeholder="Enter your email"
            disabled={isSubmitting}
            className="w-full bg-transparent border border-white/30 text-white font-mono text-sm px-4 py-3 mb-2 focus:outline-none focus:border-white/60 transition-colors placeholder:text-white/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full border border-white/30 text-white font-mono text-sm py-3 hover:bg-white hover:text-black transition-all duration-200 tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "SUBMITTING..." : "NOTIFY ME"}
          </button>
        </form>

        {/* Success Message */}
        {success && (
          <div className="mb-4 text-white font-mono text-xs text-center">{success}</div>
        )}

        {/* Early Access - Small text button */}
        <div className="mt-8">
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="text-white/40 font-mono text-xs tracking-wider hover:text-white/60 transition-colors underline"
          >
            EARLY ACCESS
          </button>
        </div>

        {/* Password Input (shown when EARLY ACCESS is clicked) */}
        {showPassword && (
          <form onSubmit={handlePasswordSubmit} className="mt-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              placeholder="Password"
              className="w-full bg-transparent border border-white/30 text-white font-mono text-sm px-4 py-2 mb-2 focus:outline-none focus:border-white/60 transition-colors placeholder:text-white/40"
              autoFocus
            />
            <button
              type="submit"
              className="w-full border border-white/30 text-white font-mono text-xs py-2 hover:bg-white hover:text-black transition-all duration-200 tracking-wider"
            >
              UNLOCK
            </button>
          </form>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 text-white/60 font-mono text-xs">{error}</div>
        )}
      </div>
    </div>
  )
}

