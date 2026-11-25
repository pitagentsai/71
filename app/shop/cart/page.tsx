import Link from "next/link"
import { CD_COVER_CLASS, formatMoney, getCart, isCd, shopifyConfigured } from "@/lib/shopify"
import { NotConfigured } from "../not-configured"
import { changeQuantity, getCartId, removeFromCart } from "../actions"
import { PageTransition, ViewTransition } from "@/components/view-transition"

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
            // A removed line fades out and the lines below glide up into its place
            <ViewTransition key={line.id} name={`cart-line-${line.id}`} exit="line-out" update="cart-line" share="cart-line" default="none">
            <li className="flex gap-4 py-6">
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
                <div className="mt-auto flex items-center gap-3">
                  <QtyButton lineId={line.id} quantity={line.quantity - 1} label="−" />
                  <span key={line.quantity} className="mo-fade min-w-4 text-center tabular-nums">{line.quantity}</span>
                  <QtyButton lineId={line.id} quantity={line.quantity + 1} label="+" />
                  <form action={removeFromCart} className="ml-4">
                    <input type="hidden" name="lineId" value={line.id} />
                    <button className="font-medium text-[10px] uppercase tracking-[0.25em] text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-900">Remove</button>
                  </form>
                </div>
              </div>
              <span className="text-sm tabular-nums">{formatMoney(line.cost.totalAmount)}</span>
            </li>
            </ViewTransition>
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

function QtyButton({ lineId, quantity, label }: { lineId: string; quantity: number; label: string }) {
  return (
    <form action={changeQuantity}>
      <input type="hidden" name="lineId" value={lineId} />
      <input type="hidden" name="quantity" value={quantity} />
      <button className="flex h-7 w-7 items-center justify-center rounded border border-neutral-300 transition-[border-color,transform] hover:border-neutral-900 active:scale-90">
        {label}
      </button>
    </form>
  )
}
