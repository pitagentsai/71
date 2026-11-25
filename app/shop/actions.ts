"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { addCartLines, createCart, getCart, isVariantAvailable, removeCartLine, updateCartLine } from "@/lib/shopify"

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
const NO_MORE = "Sorry, no more of this size is available."

// Returns an error message instead of throwing, so a Shopify hiccup shows a message
// next to the button rather than crashing the whole page.
export async function addToCart(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const merchandiseId = String(formData.get("variantId") || "")
  if (!merchandiseId) return { error: "Please choose a size." }

  try {
    // Never put a sold-out size in the cart, even if the page was open from before it sold out
    if (!(await isVariantAvailable(merchandiseId))) return { error: "Sorry, this size is sold out." }

    const line = [{ merchandiseId, quantity: 1 }]
    const cartId = await getCartId()
    const existing = cartId ? await getCart(cartId).catch(() => null) : null

    const qtyIn = (c: { lines: { quantity: number; merchandise: { id: string } }[] } | null) =>
      c?.lines.find((l) => l.merchandise.id === merchandiseId)?.quantity ?? 0

    let cart
    let before = qtyIn(existing)
    try {
      cart = existing ? await addCartLines(existing.id, line) : await createCart(line)
    } catch (e) {
      // A cart that's finished checkout (or expired) can't take new lines: start a fresh one
      if (!existing) throw e
      cart = await createCart(line)
      before = 0
    }
    if (cart.id !== cartId) await setCartId(cart.id)

    // Shopify won't put more in the cart than is in stock; if nothing was added, say so (without revealing counts)
    if (qtyIn(cart) <= before) return { error: NO_MORE }
  } catch (e) {
    console.error("addToCart failed:", e)
    const msg = e instanceof Error ? e.message : ""
    if (/sold out|not enough|out of stock|inventory/i.test(msg)) return { error: "Sorry, this size just sold out." }
    return { error: TRY_AGAIN }
  }

  revalidatePath("/shop", "layout")
  redirect("/shop/cart")
}

export type LineResult = { quantity: number | null; error: string | null }

const UPDATE_FAILED = "Couldn't update. Please try again."
const NOT_ENOUGH = "Not enough in stock."

// Sets a cart line to an absolute quantity (the client sends the shopper's final number after
// they stop tapping). If there isn't enough stock, the line goes back to `previous` and the shopper
// gets a message; stock counts are never revealed.
export async function updateLineQuantity(lineId: string, quantity: number, previous: number): Promise<LineResult> {
  const cartId = await getCartId()
  const valid = (n: number) => Number.isInteger(n) && n >= 1 && n <= 99
  if (!cartId || !lineId || !valid(quantity) || !valid(previous)) {
    return { quantity: null, error: UPDATE_FAILED }
  }
  try {
    let cart = await updateCartLine(cartId, lineId, quantity)
    const saved = cart.lines.find((l) => l.id === lineId)?.quantity ?? quantity
    let result: LineResult = { quantity: saved, error: null }

    if (saved < quantity) {
      // Shopify capped the line at what's in stock. Don't show that number: put it back.
      const back = Math.min(previous, saved)
      if (back !== saved) cart = await updateCartLine(cartId, lineId, back)
      result = { quantity: back, error: NOT_ENOUGH }
    }
    revalidatePath("/shop", "layout")
    return result
  } catch (e) {
    console.error("updateLineQuantity failed:", e)
    const msg = e instanceof Error ? e.message : ""
    return { quantity: null, error: /stock|available|inventory|not enough/i.test(msg) ? NOT_ENOUGH : UPDATE_FAILED }
  }
}

export async function removeLine(lineId: string): Promise<{ error: string | null }> {
  const cartId = await getCartId()
  if (!cartId || !lineId) return { error: UPDATE_FAILED }
  try {
    await removeCartLine(cartId, lineId)
    revalidatePath("/shop", "layout")
    return { error: null }
  } catch (e) {
    console.error("removeLine failed:", e)
    return { error: UPDATE_FAILED }
  }
}
