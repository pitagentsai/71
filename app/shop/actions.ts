"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { addCartLines, createCart, getCart, removeCartLine, updateCartLine } from "@/lib/shopify"

const CART_COOKIE = "strada_cart"

export async function getCartId() {
  return (await cookies()).get(CART_COOKIE)?.value
}

async function setCartId(id: string) {
  ;(await cookies()).set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export type CartActionState = { error: string | null }

const TRY_AGAIN = "Couldn't add to cart. Please try again."

// Returns an error message instead of throwing, so a Shopify hiccup shows a message
// next to the button rather than crashing the whole page.
export async function addToCart(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const merchandiseId = String(formData.get("variantId") || "")
  if (!merchandiseId) return { error: "Please choose a size." }

  try {
    const line = [{ merchandiseId, quantity: 1 }]
    const cartId = await getCartId()
    const existing = cartId ? await getCart(cartId).catch(() => null) : null

    let cart
    try {
      cart = existing ? await addCartLines(existing.id, line) : await createCart(line)
    } catch (e) {
      // A cart that's finished checkout (or expired) can't take new lines: start a fresh one
      if (!existing) throw e
      cart = await createCart(line)
    }
    if (cart.id !== cartId) await setCartId(cart.id)
  } catch (e) {
    console.error("addToCart failed:", e)
    const msg = e instanceof Error ? e.message : ""
    if (/sold out|not enough|out of stock|inventory/i.test(msg)) return { error: "Sorry, this size just sold out." }
    return { error: TRY_AGAIN }
  }

  revalidatePath("/shop", "layout")
  redirect("/shop/cart")
}

export async function changeQuantity(formData: FormData) {
  const cartId = await getCartId()
  const lineId = String(formData.get("lineId") || "")
  const quantity = Number(formData.get("quantity"))
  if (!cartId || !lineId || Number.isNaN(quantity)) return

  try {
    if (quantity <= 0) await removeCartLine(cartId, lineId)
    else await updateCartLine(cartId, lineId, quantity)
  } catch (e) {
    console.error("changeQuantity failed:", e) // cart re-renders with the real quantities
  }
  revalidatePath("/shop", "layout")
}

export async function removeFromCart(formData: FormData) {
  const cartId = await getCartId()
  const lineId = String(formData.get("lineId") || "")
  if (!cartId || !lineId) return
  try {
    await removeCartLine(cartId, lineId)
  } catch (e) {
    console.error("removeFromCart failed:", e)
  }
  revalidatePath("/shop", "layout")
}
