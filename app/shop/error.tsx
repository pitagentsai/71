"use client"

import Link from "next/link"
import { useEffect } from "react"

// Shown inside the shop layout (logo + nav stay) if a shop page fails to render,
// instead of the bare "This page couldn't load" screen.
export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-sm text-center">
      <p className="text-[12px] font-medium uppercase tracking-[0.3em]">Something went wrong</p>
      <p className="mt-3 text-sm text-neutral-500">Please try again. Your cart is safe.</p>
      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded bg-neutral-900 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.3em] text-white hover:opacity-80"
        >
          Try again
        </button>
        <Link
          href="/shop"
          className="rounded border border-neutral-300 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.3em] hover:border-neutral-900"
        >
          Shop
        </Link>
      </div>
    </div>
  )
}
