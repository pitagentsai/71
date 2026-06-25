"use client"

import { useState, useEffect, useCallback } from "react"
import { Instagram, Youtube } from "lucide-react"

// External destinations
const SHOP_URL = "https://www.kidzlori.com"
const YOUTUBE_URL = "https://www.youtube.com/@kidzlori"
const INSTAGRAM_URL = "https://www.instagram.com/kidzlori/"

// Lifestyle carousel photos (our models)
const LIFESTYLE_PHOTOS = [
  "/lifestyle/01.jpeg",
  "/lifestyle/02.jpeg",
  "/lifestyle/03.jpeg",
  "/lifestyle/04.jpeg",
]

const STRADA_LOGO_STYLE = {
  filter: "invert(1)",
  mixBlendMode: "multiply" as const,
  // The snake artwork is offset left inside its source PNG; nudge right so its
  // visual center lands on the exact page center (scales with the logo size).
  transform: "translateX(1.56%)",
}

export default function Home() {
  const [lifestyleOpen, setLifestyleOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const total = LIFESTYLE_PHOTOS.length

  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total])
  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total])

  const openLifestyle = useCallback(() => {
    setIndex(0)
    setLifestyleOpen(true)
  }, [])

  const closeLifestyle = useCallback(() => setLifestyleOpen(false), [])

  // Keyboard navigation + body scroll lock while the carousel is open
  useEffect(() => {
    if (!lifestyleOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLifestyle()
      else if (e.key === "ArrowRight") next()
      else if (e.key === "ArrowLeft") prev()
    }

    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [lifestyleOpen, next, prev, closeLifestyle])

  return (
    <main className="relative flex min-h-[100svh] flex-col bg-white text-neutral-900">
      {/* STRADA logo — top center */}
      <header className="flex justify-center pt-10 md:pt-12">
        <img
          src="/strada-logo.png"
          alt="STRADA"
          className="h-28 w-28 select-none object-contain md:h-40 md:w-40"
          style={STRADA_LOGO_STYLE}
        />
      </header>

      {/* Center nav — SHOP / LIFESTYLE, centered in the full viewport */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-7">
        <a
          href={SHOP_URL}
          className="pointer-events-auto -mr-[0.35em] text-[13px] font-medium tracking-[0.35em] text-neutral-900 transition-opacity duration-200 hover:opacity-40"
        >
          SHOP
        </a>
        <button
          type="button"
          onClick={openLifestyle}
          className="pointer-events-auto -mr-[0.35em] text-[13px] font-medium tracking-[0.35em] text-neutral-900 transition-opacity duration-200 hover:opacity-40"
        >
          LIFESTYLE
        </button>
      </div>

      {/* Corner social buttons — minimalistic, matched styling */}
      <a
        href={YOUTUBE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="YouTube"
        className="fixed bottom-6 left-6 z-30 text-neutral-900 transition-opacity duration-200 hover:opacity-40 md:bottom-8 md:left-8"
      >
        <Youtube className="h-5 w-5" strokeWidth={1.5} />
      </a>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="fixed bottom-6 right-6 z-30 text-neutral-900 transition-opacity duration-200 hover:opacity-40 md:bottom-8 md:right-8"
      >
        <Instagram className="h-5 w-5" strokeWidth={1.5} />
      </a>

      {/* Lifestyle carousel overlay */}
      {lifestyleOpen && (
        <LifestyleCarousel
          photos={LIFESTYLE_PHOTOS}
          index={index}
          total={total}
          onNext={next}
          onPrev={prev}
          onSelect={setIndex}
          onClose={closeLifestyle}
        />
      )}
    </main>
  )
}

function LifestyleCarousel({
  photos,
  index,
  total,
  onNext,
  onPrev,
  onSelect,
  onClose,
}: {
  photos: string[]
  index: number
  total: number
  onNext: () => void
  onPrev: () => void
  onSelect: (i: number) => void
  onClose: () => void
}) {
  // Lightweight touch swipe
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const handleTouchEnd = (endX: number) => {
    if (touchStartX === null) return
    const delta = endX - touchStartX
    if (Math.abs(delta) > 40) {
      if (delta < 0) onNext()
      else onPrev()
    }
    setTouchStartX(null)
  }

  const pad = (n: number) => String(n).padStart(2, "0")

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white text-neutral-900">
      {/* Top bar */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-6 text-[11px] font-medium tracking-[0.3em] md:px-10">
        <span>LIFESTYLE</span>
        <span className="tabular-nums text-neutral-500">
          {pad(index + 1)} / {pad(total)}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="tracking-[0.3em] transition-opacity duration-200 hover:opacity-40"
        >
          CLOSE
        </button>
      </div>

      {/* Stage */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-14 py-8 md:px-24"
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0].clientX)}
      >
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl leading-none transition-opacity duration-200 hover:opacity-40 md:left-10"
        >
          &larr;
        </button>

        <img
          key={photos[index]}
          src={photos[index]}
          alt={`Lifestyle ${index + 1}`}
          className="max-h-full max-w-full object-contain shadow-sm"
        />

        <button
          type="button"
          onClick={onNext}
          aria-label="Next"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl leading-none transition-opacity duration-200 hover:opacity-40 md:right-10"
        >
          &rarr;
        </button>
      </div>

      {/* Pagination */}
      <div className="flex h-16 shrink-0 items-center justify-center gap-3 border-t border-neutral-200">
        {photos.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`Go to photo ${i + 1}`}
            className={`h-px w-8 transition-colors duration-200 ${
              i === index ? "bg-neutral-900" : "bg-neutral-300 hover:bg-neutral-500"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
