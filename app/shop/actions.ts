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

export async function addToCart(formData: FormData) {
  const merchandiseId = String(formData.get("variantId") || "")
  if (!merchandiseId) return

  const line = [{ merchandiseId, quantity: 1 }]
  const cartId = await getCartId()
  const existing = cartId ? await getCart(cartId).catch(() => null) : null

  const cart = existing ? await addCartLines(existing.id, line) : await createCart(line)
  if (!existing) await setCartId(cart.id)

  revalidatePath("/shop", "layout")
  redirect("/shop/cart")
}

export async function changeQuantity(formData: FormData) {
  const cartId = await getCartId()
  const lineId = String(formData.get("lineId") || "")
  const quantity = Number(formData.get("quantity"))
  if (!cartId || !lineId || Number.isNaN(quantity)) return

  if (quantity <= 0) await removeCartLine(cartId, lineId)
  else await updateCartLine(cartId, lineId, quantity)
  revalidatePath("/shop", "layout")
}

export async function removeFromCart(formData: FormData) {
  const cartId = await getCartId()
  const lineId = String(formData.get("lineId") || "")
  if (!cartId || !lineId) return
  await removeCartLine(cartId, lineId)
  revalidatePath("/shop", "layout")
}
