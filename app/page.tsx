"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Instagram, Youtube } from "lucide-react"

// External destinations
const YOUTUBE_URL = "https://www.youtube.com/@kidzlori"
const INSTAGRAM_URL = "https://www.instagram.com/kidzlori/"

// Lifestyle carousel photos (our models)
const LIFESTYLE_PHOTOS = [
  "/lifestyle/05.jpeg",
  "/lifestyle/07.jpeg",
  "/lifestyle/08.jpeg",
]

// 3D white-stone logo still life (WebGL, client only)
const StoneLogoScene = dynamic(() => import("@/components/stone-logo-scene"), { ssr: false })

const NAV_LINK =
  "pointer-events-auto -mr-[0.35em] text-[13px] font-medium tracking-[0.35em] text-neutral-900 transition-opacity duration-200 hover:opacity-40"
const SOCIAL_LINK =
  "fixed bottom-6 z-30 text-neutral-900 transition-opacity duration-200 hover:opacity-40 md:bottom-8"

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
    <main className="relative h-[100svh] overflow-hidden bg-[#f7f5f1] text-neutral-900">
      {/* STRADA logo as a white stone relic lying on a seamless white floor */}
      <div className="absolute inset-0">
        <StoneLogoScene />
      </div>

      <h1 className="sr-only">STRADA</h1>

      {/* Nav — SHOP / LIFESTYLE, below the logo */}
      <nav className="pointer-events-none absolute inset-x-0 bottom-[10%] flex flex-col items-center gap-6">
        <Link href="/shop" className={NAV_LINK}>
          SHOP
        </Link>
        <button type="button" onClick={openLifestyle} className={NAV_LINK}>
          LIFESTYLE
        </button>
      </nav>

      {/* Corner social buttons — minimalistic, matched styling */}
      <a
        href={YOUTUBE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="YouTube"
        className={`${SOCIAL_LINK} left-6 md:left-8`}
      >
        <Youtube className="h-5 w-5" strokeWidth={1.5} />
      </a>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className={`${SOCIAL_LINK} right-6 md:right-8`}
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
