"use client"

import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"

type Image = { url: string; altText: string | null }

export function ProductGallery({ images, title, coverClass = "" }: { images: Image[]; title: string; coverClass?: string }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: images.length > 1 })
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!embla) return
    const onSelect = () => setIndex(embla.selectedScrollSnap())
    onSelect()
    embla.on("select", onSelect)
    return () => {
      embla.off("select", onSelect)
    }
  }, [embla])

  const prev = useCallback(() => embla?.scrollPrev(), [embla])
  const next = useCallback(() => embla?.scrollNext(), [embla])

  if (!images.length) return null

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {images.map((img, i) => (
            <div key={img.url} className="aspect-square min-w-0 shrink-0 grow-0 basis-full">
              <img
                src={img.url}
                alt={img.altText ?? `${title} ${i + 1}`}
                className={`h-full w-full select-none object-contain ${coverClass}`}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-0 top-1/2 -translate-y-1/2 px-3 py-6 text-lg transition-[opacity,transform] hover:opacity-40 active:-translate-x-1"
          >
            ←
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next photo"
            className="absolute right-0 top-1/2 -translate-y-1/2 px-3 py-6 text-lg transition-[opacity,transform] hover:opacity-40 active:translate-x-1"
          >
            →
          </button>
          <div className="mt-4 flex justify-center gap-2">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => embla?.scrollTo(i)}
                aria-label={`Photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-5 bg-neutral-900" : "w-1.5 bg-neutral-300"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
