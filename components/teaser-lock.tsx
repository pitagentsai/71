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
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  // Set countdown target date to February 5th, 2026 at midnight Warsaw, Poland time
  useEffect(() => {
    // Warsaw is UTC+1 in February (CET), so midnight Warsaw = 23:00 UTC on Feb 4
    // Create date for February 5, 2026 00:00:00 Warsaw time = February 4, 2026 23:00:00 UTC
    const targetDate = new Date('2026-02-04T23:00:00Z') // UTC time equivalent to Feb 5 midnight Warsaw
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
      console.log('Submitting email:', email)
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      let data
      try {
        data = await response.json()
        console.log('Response data:', data)
      } catch (jsonError) {
        console.error('Failed to parse response JSON:', jsonError)
        const text = await response.text()
        console.error('Response text:', text)
        setError("Server error: Invalid response format")
        setIsSubmitting(false)
        return
      }

      if (response.ok && data.success) {
        setSuccess(data.message || "Thank you for showing interest in ENEMY CORP. You will be 71.")
        setEmail("") // Clear the email field
      } else {
        setError(data.error || data.details || "Failed to sign up. Please try again.")
      }
    } catch (error: any) {
      console.error('Error submitting email:', error)
      setError(error.message || "Something went wrong. Please try again.")
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
      <div className="text-center px-4 max-w-md w-full relative z-10">
        {/* Countdown */}
        <div className="mb-12">
          <div className="mb-8 flex justify-center">
            <img
              src="/Rectangle (1).png"
              alt="setteuno"
              className="h-24 md:h-32 w-auto brightness-0 invert"
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

