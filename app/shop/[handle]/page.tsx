import Link from "next/link"
import { notFound } from "next/navigation"
import { getProduct, shopifyConfigured } from "@/lib/shopify"
import { NotConfigured } from "../not-configured"
import { ProductForm } from "./product-form"
import { ProductGallery } from "./product-gallery"
import { PageTransition } from "@/components/view-transition"

export const dynamic = "force-dynamic"

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  if (!shopifyConfigured) return <NotConfigured />

  const { handle } = await params
  const product = await getProduct(handle)
  if (!product) notFound()

  const images = product.images.length ? product.images : product.featuredImage ? [product.featuredImage] : []

  return (
    <PageTransition>
      <Link href="/shop" transitionTypes={["nav-back"]} className="font-medium text-[11px] uppercase tracking-[0.3em] transition-opacity hover:opacity-40">
        ← Back
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
        <ProductGallery images={images} title={product.title} />

        <div className="mo-fade mx-auto flex w-full max-w-sm flex-col items-center text-center md:mt-16">
          <h1 className="font-medium text-xs uppercase leading-relaxed tracking-[0.12em] md:text-sm">{product.title}</h1>
          <ProductForm product={product} />
          {product.descriptionHtml && (
            <div
              className="mt-10 text-xs leading-relaxed text-neutral-700 [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          )}
        </div>
      </div>
    </PageTransition>
  )
}
