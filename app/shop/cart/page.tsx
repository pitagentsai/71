import Link from "next/link"
import { CD_COVER_CLASS, formatMoney, getCart, isCd, shopifyConfigured } from "@/lib/shopify"
import { NotConfigured } from "../not-configured"
import { getCartId } from "../actions"
import { PageTransition } from "@/components/view-transition"
import { CartLineControls } from "./line-controls"

export const dynamic = "force-dynamic"

export default async function CartPage() {
  if (!shopifyConfigured) return <NotConfigured />

  const cartId = await getCartId()
  const cart = cartId ? await getCart(cartId).catch(() => null) : null

  if (!cart || cart.lines.length === 0) {
    return (
      <PageTransition>
        <div className="text-center">
          <h1 className="font-medium text-xs uppercase tracking-[0.3em]">Cart</h1>
          <p className="mt-4 text-sm text-neutral-500">Your cart is empty.</p>
          <Link
            href="/shop"
            transitionTypes={["nav-back"]}
            className="mt-8 inline-block rounded bg-neutral-900 px-5 py-3 font-medium text-[11px] uppercase tracking-[0.3em] text-white transition-[opacity,transform] hover:opacity-80 active:scale-95"
          >
            Continue shopping
          </Link>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
    <div className="mx-auto max-w-3xl">
      <h1 className="text-center font-medium text-xs uppercase tracking-[0.3em]">Cart</h1>

      <ul className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
        {cart.lines.map((line) => {
          const { product } = line.merchandise
          const variantTitle = line.merchandise.title === "Default Title" ? null : line.merchandise.title
          return (
            <li key={line.id} className="flex gap-4 py-6">
              <Link href={`/shop/${product.handle}`} transitionTypes={["nav-back"]} className="h-24 w-24 shrink-0">
                {product.featuredImage && (
                  <img src={product.featuredImage.url} alt={product.title} className={`h-full w-full object-contain ${isCd(product.title) ? CD_COVER_CLASS : ""}`} />
                )}
              </Link>
              <div className="flex flex-1 flex-col gap-1 text-sm">
                <Link href={`/shop/${product.handle}`} transitionTypes={["nav-back"]} className="font-medium text-[12px] uppercase leading-relaxed tracking-[0.12em]">
                  {product.title}
                </Link>
                {variantTitle && <span className="text-neutral-500">{variantTitle}</span>}
                <CartLineControls lineId={line.id} quantity={line.quantity} />
              </div>
              <span className="text-sm tabular-nums">{formatMoney(line.cost.totalAmount)}</span>
            </li>
          )
        })}
      </ul>

      <div className="mt-8 flex items-center justify-between text-sm">
        <span className="font-medium text-[12px] uppercase tracking-[0.3em]">Subtotal</span>
        <span className="font-semibold tabular-nums">{formatMoney(cart.cost.subtotalAmount)}</span>
      </div>
      <p className="mt-2 text-[11px] text-neutral-500">Shipping and taxes calculated at checkout.</p>

      <a
        href={cart.checkoutUrl}
        className="mt-8 block w-full rounded bg-neutral-900 px-4 py-3.5 text-center font-medium text-[12px] uppercase tracking-[0.3em] text-white transition-[opacity,transform] hover:opacity-80 active:scale-[0.98]"
      >
        Checkout
      </a>
    </div>
    </PageTransition>
  )
}
