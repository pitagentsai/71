import Link from "next/link"
import { formatMoney, getProducts, shopifyConfigured, type Product } from "@/lib/shopify"
import { NotConfigured } from "./not-configured"
import { PageTransition } from "@/components/view-transition"

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
            className={`h-full w-full object-contain transition-transform duration-700 ${EASE} group-hover:scale-[1.03]`}
            loading="lazy"
          />
        )}
      </Link>

      <div className="flex flex-col items-center">
        <Link
          href={href}
          transitionTypes={["nav-forward"]}
          className="mt-2.5 font-medium text-[11px] uppercase leading-snug tracking-[0.12em] md:text-[13px]"
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

// Sizes at a glance: in-stock sizes solid, sold-out sizes faded and struck through
function SizePreview({ product }: { product: Product }) {
  const option =
    product.options.find((o) => SIZE_OPTION.test(o.name)) ??
    product.options.find((o) => o.values.length > 1)
  if (!option) return null

  const inStock = (size: string) =>
    product.variants.some(
      (v) => v.availableForSale && v.selectedOptions.some((o) => o.name === option.name && o.value === size),
    )

  return (
    <ul className="mt-1.5 flex flex-wrap justify-center gap-1" aria-label={`${option.name} availability`}>
      {option.values.map((size) => {
        const available = inStock(size)
        return (
          <li
            key={size}
            title={available ? `${size}: in stock` : `${size}: sold out`}
            className={`min-w-6 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium leading-none tabular-nums md:text-[11px] ${
              available ? "border-neutral-400 text-neutral-900" : "border-neutral-200 text-neutral-300 line-through"
            }`}
          >
            <span className="sr-only">{available ? "" : "Sold out: "}</span>
            {size}
          </li>
        )
      })}
    </ul>
  )
}
