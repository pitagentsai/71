"use client"

import { useEffect, useRef, useState } from "react"
import { removeLine, updateLineQuantity } from "../actions"

const SAVE_DELAY = 350 // ms after the last tap before saving, so rapid taps become one request

/**
 * Quantity − / + and Remove for one cart line.
 * - The number changes instantly on tap; taps are batched and saved as one absolute quantity.
 * - Only one save per line runs at a time; taps made during a save are sent right after it.
 * - If there isn't enough stock, the number goes back to what it was, with a message (no stock counts shown).
 */
export function CartLineControls({ lineId, quantity }: { lineId: string; quantity: number }) {
  const [qty, setQty] = useState(quantity)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wanted = useRef(quantity) // what the shopper asked for
  const saved = useRef(quantity) // what Shopify last confirmed
  const inFlight = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // New server value (after a save, or the cart changed elsewhere): adopt it if nothing is pending
  useEffect(() => {
    if (!inFlight.current && wanted.current === saved.current) {
      wanted.current = quantity
      saved.current = quantity
      setQty(quantity)
    }
  }, [quantity])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  async function save() {
    if (inFlight.current) return
    if (wanted.current === saved.current) {
      setSaving(false) // e.g. tapped + then − back to the saved number
      return
    }
    inFlight.current = true
    setSaving(true)
    const target = wanted.current

    const res = await updateLineQuantity(lineId, target, saved.current).catch(() => ({
      quantity: null,
      error: "Couldn't update. Please try again.",
    }))
    inFlight.current = false

    if (res.quantity === null) {
      // Rejected: go back to the last confirmed quantity
      wanted.current = saved.current
      setQty(saved.current)
      setError(res.error)
      setSaving(false)
      return
    }

    saved.current = res.quantity
    if (res.error || wanted.current === target) {
      // Not enough stock (reverted), or no new taps meanwhile: show what Shopify saved
      wanted.current = res.quantity
      setQty(res.quantity)
    }
    setError(res.error)

    if (wanted.current !== saved.current) save() // more taps arrived during the save
    else setSaving(false)
  }

  function change(delta: number) {
    const next = Math.min(99, Math.max(1, wanted.current + delta))
    if (next === wanted.current) return
    wanted.current = next
    setQty(next)
    setError(null)
    setSaving(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(save, SAVE_DELAY)
  }

  async function remove() {
    if (removing) return
    if (timer.current) clearTimeout(timer.current)
    setRemoving(true)
    setError(null)
    const res = await removeLine(lineId).catch(() => ({ error: "Couldn't remove. Please try again." }))
    if (res.error) {
      setRemoving(false)
      setError(res.error)
    }
    // On success the cart re-renders without this line
  }

  const btn =
    "flex h-8 w-8 items-center justify-center rounded border border-neutral-300 text-base leading-none transition-colors hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-300"

  return (
    <div className={`mt-auto ${removing ? "pointer-events-none opacity-40" : ""}`}>
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Decrease quantity" onClick={() => change(-1)} disabled={qty <= 1 || removing} className={btn}>
          −
        </button>
        <span
          aria-live="polite"
          className={`min-w-5 text-center tabular-nums transition-opacity ${saving ? "opacity-50" : ""}`}
        >
          {qty}
        </span>
        <button type="button" aria-label="Increase quantity" onClick={() => change(1)} disabled={qty >= 99 || removing} className={btn}>
          +
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={removing}
          className="ml-4 font-medium text-[10px] uppercase tracking-[0.25em] text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-900"
        >
          {removing ? "Removing…" : "Remove"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
