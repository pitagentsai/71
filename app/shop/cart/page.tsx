import Link from "next/link"
import { formatMoney, getCart, shopifyConfigured } from "@/lib/shopify"
import { NotConfigured } from "../not-configured"
import { changeQuantity, getCartId, removeFromCart } from "../actions"

export const dynamic = "force-dynamic"

export default async function CartPage() {
  if (!shopifyConfigured) return <NotConfigured />

  const cartId = await getCartId()
  const cart = cartId ? await getCart(cartId).catch(() => null) : null

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="text-center">
        <h1 className="text-sm font-bold uppercase">Cart</h1>
        <p className="mt-4 text-xs text-neutral-500">Your cart is empty.</p>
        <Link href="/shop" className="mt-8 inline-block rounded bg-neutral-900 px-4 py-2 text-[11px] text-white hover:opacity-80">
          Continue shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-sm font-bold uppercase">Cart</h1>

      <ul className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
        {cart.lines.map((line) => {
          const { product } = line.merchandise
          const variantTitle = line.merchandise.title === "Default Title" ? null : line.merchandise.title
          return (
            <li key={line.id} className="flex gap-4 py-6">
              <Link href={`/shop/${product.handle}`} className="h-24 w-24 shrink-0">
                {product.featuredImage && (
                  <img src={product.featuredImage.url} alt={product.title} className="h-full w-full object-contain" />
                )}
              </Link>
              <div className="flex flex-1 flex-col gap-1 text-xs">
                <Link href={`/shop/${product.handle}`} className="font-bold uppercase">
                  {product.title}
                </Link>
                {variantTitle && <span className="text-neutral-500">{variantTitle}</span>}
                <div className="mt-auto flex items-center gap-3">
                  <QtyButton lineId={line.id} quantity={line.quantity - 1} label="−" />
                  <span className="tabular-nums">{line.quantity}</span>
                  <QtyButton lineId={line.id} quantity={line.quantity + 1} label="+" />
                  <form action={removeFromCart} className="ml-4">
                    <input type="hidden" name="lineId" value={line.id} />
                    <button className="text-[11px] uppercase text-neutral-500 underline hover:text-neutral-900">Remove</button>
                  </form>
                </div>
              </div>
              <span className="text-xs">{formatMoney(line.cost.totalAmount)}</span>
            </li>
          )
        })}
      </ul>

      <div className="mt-8 flex items-center justify-between text-sm">
        <span className="uppercase">Subtotal</span>
        <span className="font-bold">{formatMoney(cart.cost.subtotalAmount)}</span>
      </div>
      <p className="mt-2 text-[11px] text-neutral-500">Shipping and taxes calculated at checkout.</p>

      <a
        href={cart.checkoutUrl}
        className="mt-8 block w-full rounded bg-neutral-900 px-4 py-3 text-center text-xs uppercase tracking-wider text-white hover:opacity-80"
      >
        Checkout
      </a>
    </div>
  )
}

function QtyButton({ lineId, quantity, label }: { lineId: string; quantity: number; label: string }) {
  return (
    <form action={changeQuantity}>
      <input type="hidden" name="lineId" value={lineId} />
      <input type="hidden" name="quantity" value={quantity} />
      <button className="flex h-6 w-6 items-center justify-center rounded border border-neutral-300 hover:border-neutral-900">
        {label}
      </button>
    </form>
  )
}
