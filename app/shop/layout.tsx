import type React from "react"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { getCart, shopifyConfigured } from "@/lib/shopify"
import { getCartId } from "./actions"
import { LOGO_HEADER_CLASS, SiteLogo } from "@/components/site-logo"

export const metadata = { title: "setteuno" }

async function cartCount() {
  if (!shopifyConfigured) return 0
  const id = await getCartId()
  if (!id) return 0
  const cart = await getCart(id).catch(() => null)
  return cart?.totalQuantity ?? 0
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const count = await cartCount()

  return (
    <div className="flex min-h-[100svh] flex-col bg-white font-sans text-neutral-900">
      <header className={`${LOGO_HEADER_CLASS} gap-3`}>
        <Link href="/" aria-label="STRADA home" transitionTypes={["nav-back"]} className="block">
          <SiteLogo />
        </Link>
        <nav className="flex items-center gap-10 font-medium text-[13px] uppercase tracking-[0.35em]">
          <Link href="/shop" transitionTypes={["nav-back"]} className="py-1 transition-opacity hover:opacity-40">
            Shop
          </Link>
          <Link href="/shop/cart" transitionTypes={["nav-forward"]} className="flex items-center gap-1.5 py-1 transition-opacity hover:opacity-40">
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="overflow-hidden">
              Cart
              {count > 0 && (
                <>
                  {" ("}
                  <span key={count} className="mo-fade">
                    {count}
                  </span>
                  {")"}
                </>
              )}
            </span>
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 md:px-8 md:pt-10">{children}</main>

      <footer className="border-t border-neutral-200 px-4 py-8 text-center font-medium text-[11px] uppercase tracking-[0.3em] text-neutral-500">
        © {new Date().getFullYear()} STRADA
      </footer>
    </div>
  )
}
