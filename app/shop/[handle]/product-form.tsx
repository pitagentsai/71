"use client"

import { useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import type { Product } from "@/lib/shopify"
import { addToCart } from "../actions"

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

  const isAvailable = (name: string, value: string) =>
    product.variants.some(
      (v) =>
        v.availableForSale &&
        v.selectedOptions.every((o) => (o.name === name ? o.value === value : selected[o.name] === o.value)),
    )

  const price = variant?.price ?? product.priceRange.minVariantPrice

  return (
    <form action={addToCart} className="mt-2">
      <p className="text-sm">{formatMoney(price.amount, price.currencyCode)}</p>

      {options.map((option) => (
        <fieldset key={option.name} className="mt-8">
          <legend className="mb-3 text-[11px] uppercase tracking-wider text-neutral-500">{option.name}</legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const active = selected[option.name] === value
              const available = isAvailable(option.name, value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelected((s) => ({ ...s, [option.name]: value }))}
                  className={`min-w-11 rounded border px-3 py-2 text-xs transition-colors ${
                    active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:border-neutral-900"
                  } ${available ? "" : "text-neutral-400 line-through"}`}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}

      <input type="hidden" name="variantId" value={variant?.id ?? ""} />
      <SubmitButton disabled={!variant?.availableForSale} />
    </form>
  )
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="mt-8 w-full rounded bg-neutral-900 px-4 py-3 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:bg-neutral-400"
    >
      {disabled ? "Sold out" : pending ? "Adding…" : "Add to cart"}
    </button>
  )
}
