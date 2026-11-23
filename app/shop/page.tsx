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
    // 2 per row; flex-wrap + justify-center puts an odd last item in the middle
    <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-x-4 gap-y-14 md:gap-x-10">
      {products.map((p) => (
        <div key={p.id} className="w-[calc(50%-0.5rem)] md:w-[calc(50%-1.25rem)]">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const href = `/shop/${product.handle}`
  return (
    <div className="flex flex-col items-center text-center">
      <Link href={href} className="block aspect-square w-full overflow-hidden bg-white">
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
        className={`mt-3 rounded px-3 py-2 text-[10px] text-white transition-opacity hover:opacity-80 md:text-[11px] ${
          product.availableForSale ? "bg-neutral-900" : "bg-neutral-400"
        }`}
      >
        {product.availableForSale ? "View product" : "Sold out"}
      </Link>
    </div>
  )
}
