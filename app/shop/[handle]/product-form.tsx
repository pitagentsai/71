"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import type { Product } from "@/lib/shopify"
import { variantFor, variantStock } from "@/lib/stock"
import { addToCart, type CartActionState } from "../actions"

// Bundled React canary has useActionState; the installed @types/react (v18) doesn't declare it yet
const useActionState = (React as unknown as {
  useActionState: <S>(action: (prev: S, data: FormData) => Promise<S>, initial: S) => [S, (data: FormData) => void, boolean]
}).useActionState

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: currencyCode }).format(Number(amount))
}

export function ProductForm({ product }: { product: Product }) {
  // Hide Shopify's placeholder "Title / Default Title" option on single-variant products
  const options = product.options.filter((o) => !(o.values.length === 1 && o.values[0] === "Default Title"))

  const first = product.variants.find((v) => v.availableForSale) ?? product.variants[0]
  const [selected, setSelected] = useState<Record<string, string>>(
    Object.fromEntries(first?.selectedOptions.map((o) => [o.name, o.value]) ?? []),
  )

  const variant = useMemo(
    () => product.variants.find((v) => v.selectedOptions.every((o) => selected[o.name] === o.value)),
    [product.variants, selected],
  )

  // Stock level of each option value given the other selections ("out" sizes can't be picked)
  const levelOf = (name: string, value: string) => {
    const v = variantFor(product, name, value, selected)
    return v ? variantStock(v) : "out"
  }
  const selectedLow = Boolean(variant && variantStock(variant) === "low")

  const price = variant?.price ?? product.priceRange.minVariantPrice
  const [state, formAction] = useActionState<CartActionState>(addToCart, { error: null })

  return (
    <form action={formAction} className="mt-2 flex w-full flex-col items-center text-center">
      <p className="text-sm tabular-nums md:text-base">{formatMoney(price.amount, price.currencyCode)}</p>

      {options.map((option) => (
        <fieldset key={option.name} className="mt-8">
          <legend className="mx-auto mb-3 font-medium text-[11px] uppercase tracking-[0.3em] text-neutral-500">{option.name}</legend>
          <div className="flex flex-wrap justify-center gap-2">
            {option.values.map((value) => {
              const active = selected[option.name] === value
              const level = levelOf(option.name, value)
              const out = level === "out"
              return (
                <button
                  key={value}
                  type="button"
                  disabled={out}
                  aria-label={out ? `${value}, sold out` : level === "low" ? `${value}, low stock` : value}
                  onClick={() => setSelected((s) => ({ ...s, [option.name]: value }))}
                  className={`relative min-w-11 rounded border px-3 py-2 text-xs font-medium transition-[color,background-color,border-color,transform] duration-200 ${
                    out
                      ? "cursor-not-allowed border-neutral-200 text-neutral-300 line-through"
                      : active
                        ? "border-neutral-900 bg-neutral-900 text-white active:scale-95"
                        : "border-neutral-300 hover:border-neutral-900 active:scale-95"
                  }`}
                >
                  {value}
                  {level === "low" && (
                    <span aria-hidden className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
                  )}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}

      {selectedLow && (
        <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.25em] text-red-600">Low stock</p>
      )}

      <input type="hidden" name="variantId" value={variant?.id ?? ""} />
      <SubmitButton disabled={!variant?.availableForSale} />
      {state.error && (
        <p role="alert" className="mt-3 text-xs text-red-600">
          {state.error}
        </p>
      )}
    </form>
  )
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="mt-8 w-full rounded bg-neutral-900 px-4 py-3.5 font-medium text-[12px] uppercase tracking-[0.3em] text-white transition-[opacity,transform] duration-200 hover:opacity-80 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-400"
    >
      {disabled ? "Sold out" : pending ? "Adding…" : "Add to cart"}
    </button>
  )
}
