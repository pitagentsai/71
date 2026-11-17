import Link from "next/link"
import { formatMoney, getProducts, shopifyConfigured, type Product } from "@/lib/shopify"
import { NotConfigured } from "./not-configured"

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
    <div className="grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-3 md:gap-x-10">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const href = `/shop/${product.handle}`
  return (
    <div className="flex flex-col">
      <Link href={href} className="block aspect-square overflow-hidden bg-white">
        {product.featuredImage && (
          <img
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            className="h-full w-full object-contain transition-transform duration-300 hover:scale-[1.03]"
            loading="lazy"
          />
        )}
      </Link>
      <Link href={href} className="mt-5 text-[11px] font-bold uppercase leading-snug md:text-xs">
        {product.title}
      </Link>
      <p className="mt-1 text-[11px] md:text-xs">{formatMoney(product.priceRange.minVariantPrice)}</p>
      <Link
        href={href}
        className={`mt-3 self-start rounded px-3 py-2 text-[10px] text-white transition-opacity hover:opacity-80 md:text-[11px] ${
          product.availableForSale ? "bg-neutral-900" : "bg-neutral-400"
        }`}
      >
        {product.availableForSale ? "View product" : "Sold out"}
      </Link>
    </div>
  )
}
