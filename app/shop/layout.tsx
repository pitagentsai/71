import type React from "react"
import Link from "next/link"
import { Space_Mono } from "next/font/google"
import { ShoppingBag } from "lucide-react"
import { getCart, shopifyConfigured } from "@/lib/shopify"
import { getCartId } from "./actions"

const mono = Space_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "700"] })

export const metadata = { title: "STRADA — SHOP" }

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
    <div className={`${mono.className} flex min-h-[100svh] flex-col bg-white text-neutral-900`}>
      <header className="flex flex-col items-center gap-6 pt-10 md:pt-12">
        <Link href="/" aria-label="STRADA home">
          <img
            src="/strada-logo.png"
            alt="STRADA"
            className="h-28 w-28 select-none object-contain md:h-40 md:w-40"
            style={{ filter: "invert(1)", mixBlendMode: "multiply", transform: "translateX(1.56%)" }}
          />
        </Link>
        <nav className="flex items-center gap-8 text-[11px] uppercase tracking-wider">
          <Link href="/shop" className="transition-opacity hover:opacity-40">
            Shop
          </Link>
          <Link href="/shop/cart" className="relative flex flex-col items-center gap-1 transition-opacity hover:opacity-40">
            <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
            <span>Cart</span>
            {count > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[9px] text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 md:px-8">{children}</main>

      <footer className="border-t border-neutral-200 px-4 py-8 text-center text-[11px] uppercase tracking-wider text-neutral-500">
        © {new Date().getFullYear()} STRADA
      </footer>
    </div>
  )
}
