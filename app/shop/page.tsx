import Link from "next/link"
import { CD_COVER_CLASS, formatMoney, getProducts, isCd, shopifyConfigured, type Product } from "@/lib/shopify"
import { NotConfigured } from "./not-configured"
import { PageTransition } from "@/components/view-transition"
import { productStock, variantFor, variantStock } from "@/lib/stock"

export const dynamic = "force-dynamic"

export default async function ShopPage() {
  if (!shopifyConfigured) return <NotConfigured />

  let products: Product[] = []
  let error: string | null = null
  try {
    products = await getProducts()
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
    console.error(error)
  }

  if (error) return <p className="text-center text-sm text-neutral-500">Could not load products.</p>
  if (!products.length) return <p className="text-center text-sm text-neutral-500">No products yet.</p>

  return (
    <PageTransition>
      {/* 2 per row; flex-wrap + justify-center puts an odd last item in the middle */}
      <div className="mo-fade mx-auto flex max-w-4xl flex-wrap justify-center gap-x-10 gap-y-10 md:gap-x-28 md:gap-y-12">
        {products.map((p) => (
          <div key={p.id} className="w-[calc(50%-1.25rem)] md:w-[calc(50%-3.5rem)]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </PageTransition>
  )
}

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]"

function ProductCard({ product }: { product: Product }) {
  const href = `/shop/${product.handle}`
  const stock = productStock(product)

  return (
    <div className="group flex flex-col items-center text-center">
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        className="block aspect-square w-full overflow-hidden bg-white"
      >
        {product.featuredImage && (
          <img
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            className={`h-full w-full object-contain transition-transform duration-700 ${EASE} group-hover:scale-[1.03] ${isCd(product.title) ? CD_COVER_CLASS : ""} ${stock === "out" ? "opacity-50" : ""}`}
            loading="lazy"
          />
        )}
      </Link>

      <div className="flex flex-col items-center">
        <StockLabel level={stock} />
        <Link
          href={href}
          transitionTypes={["nav-forward"]}
          className="mt-1 font-medium text-[11px] uppercase leading-snug tracking-[0.12em] md:text-[13px]"
        >
          {product.title}
        </Link>
        <p className="mt-1 text-xs tabular-nums md:text-sm">{formatMoney(product.priceRange.minVariantPrice)}</p>
        <SizePreview product={product} />
        <Link
          href={href}
          transitionTypes={["nav-forward"]}
          className={`mt-2 rounded px-3 py-1.5 font-medium text-[10px] uppercase tracking-[0.25em] text-white transition-[opacity,transform] hover:opacity-80 active:scale-95 md:text-[11px] ${
            product.availableForSale ? "bg-neutral-900" : "bg-neutral-400"
          }`}
        >
          {product.availableForSale ? "View product" : "Sold out"}
        </Link>
      </div>
    </div>
  )
}

const SIZE_OPTION = /^(size|rozmiar|größe|taille|talla)$/i

// Above the product name: SOLD OUT / LOW STOCK (empty line keeps cards aligned when in stock)
function StockLabel({ level }: { level: "out" | "low" | "in" }) {
  return (
    <span
      className={`mt-2.5 h-3.5 text-[10px] font-medium uppercase leading-none tracking-[0.25em] ${
        level === "low" ? "text-red-600" : "text-neutral-400"
      }`}
    >
      {level === "out" ? "Sold out" : level === "low" ? "Low stock" : ""}
    </span>
  )
}

// Sizes at a glance: sold-out sizes faded and struck through, low-stock sizes marked with a red dot
function SizePreview({ product }: { product: Product }) {
  const option =
    product.options.find((o) => SIZE_OPTION.test(o.name)) ??
    product.options.find((o) => o.values.length > 1)
  if (!option) return null

  return (
    <ul className="mt-1.5 flex flex-wrap justify-center gap-1" aria-label={`${option.name} availability`}>
      {option.values.map((size) => {
        const v = variantFor(product, option.name, size)
        const level = v ? variantStock(v) : "out"
        return (
          <li
            key={size}
            title={level === "out" ? `${size}: sold out` : level === "low" ? `${size}: low stock` : `${size}: in stock`}
            className={`relative min-w-6 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium leading-none tabular-nums md:text-[11px] ${
              level === "out" ? "border-neutral-200 text-neutral-300 line-through" : "border-neutral-400 text-neutral-900"
            }`}
          >
            <span className="sr-only">{level === "out" ? "Sold out: " : level === "low" ? "Low stock: " : ""}</span>
            {size}
            {level === "low" && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-600" />}
          </li>
        )
      })}
    </ul>
  )
}
