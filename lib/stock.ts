import type { Product, Variant } from "./shopify"

// Stock levels shown in the shop. Usable on server and client.
// The low-stock flags are computed on the server (lib/shopify.ts) from Shopify's stock counts, which
// need the inventory scope; without it only sold-out is shown. Counts are never sent to the browser.

/** A size counts as "low" at this many units or fewer */
export const LOW_STOCK_SIZE = 3
/** A product counts as "low stock" when this many units or fewer remain across all sizes */
export const LOW_STOCK_PRODUCT = 10

export type StockLevel = "out" | "low" | "in"

export function variantStock(v: Variant): StockLevel {
  if (!v.availableForSale) return "out"
  return v.lowStock ? "low" : "in"
}

export function productStock(p: Product): StockLevel {
  if (!p.availableForSale) return "out"
  return p.lowStock ? "low" : "in"
}

/** Variant for one value of an option (e.g. size "M"), given the other selected options */
export function variantFor(p: Product, option: string, value: string, selected: Record<string, string> = {}) {
  return p.variants.find((v) =>
    v.selectedOptions.every((o) => (o.name === option ? o.value === value : !selected[o.name] || selected[o.name] === o.value)),
  )
}
