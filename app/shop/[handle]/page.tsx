import Link from "next/link"
import { notFound } from "next/navigation"
import { getProduct, shopifyConfigured } from "@/lib/shopify"
import { NotConfigured } from "../not-configured"
import { ProductForm } from "./product-form"

export const dynamic = "force-dynamic"

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  if (!shopifyConfigured) return <NotConfigured />

  const { handle } = await params
  const product = await getProduct(handle)
  if (!product) notFound()

  const images = product.images.length ? product.images : product.featuredImage ? [product.featuredImage] : []

  return (
    <div>
      <Link href="/shop" className="text-[11px] uppercase tracking-wider transition-opacity hover:opacity-40">
        ← Back
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="flex flex-col gap-4">
          {images.map((img, i) => (
            <img key={img.url} src={img.url} alt={img.altText ?? `${product.title} ${i + 1}`} className="w-full object-contain" />
          ))}
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center md:sticky md:top-10 md:self-start">
          <h1 className="text-sm font-bold uppercase md:text-base">{product.title}</h1>
          <ProductForm product={product} />
          {product.descriptionHtml && (
            <div
              className="mt-10 text-xs leading-relaxed text-neutral-700 [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
