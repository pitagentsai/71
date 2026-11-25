import "server-only"

// Shopify Storefront API client (server-side only — the private token must never reach the browser).
const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "")
const token = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN
const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-10"

export const shopifyConfigured = Boolean(domain && token)

export type Money = { amount: string; currencyCode: string }
export type Image = { url: string; altText: string | null; width?: number; height?: number }

export type Variant = {
  id: string
  title: string
  availableForSale: boolean
  price: Money
  selectedOptions: { name: string; value: string }[]
}

export type Product = {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  availableForSale: boolean
  featuredImage: Image | null
  images: Image[]
  priceRange: { minVariantPrice: Money }
  options: { name: string; values: string[] }[]
  variants: Variant[]
}

export type CartLine = {
  id: string
  quantity: number
  cost: { totalAmount: Money }
  merchandise: {
    id: string
    title: string
    product: { handle: string; title: string; featuredImage: Image | null }
  }
}

export type Cart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: { subtotalAmount: Money; totalAmount: Money }
  lines: CartLine[]
}

type Edges<T> = { edges: { node: T }[] }
const nodes = <T,>(c: Edges<T>) => c.edges.map((e) => e.node)

// Shopper's real IP. With a private token Shopify rate-limits (and bot-checks cartCreate) per IP;
// without this header every request comes from Cloudflare's servers, so all shoppers share one
// limit and cart creation gets THROTTLED under load.
async function buyerIp(): Promise<string | undefined> {
  try {
    const { headers } = await import("next/headers")
    const h = await headers()
    return h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined
  } catch {
    return undefined // not inside a request (e.g. build time)
  }
}

const isThrottled = (errors: unknown) => JSON.stringify(errors ?? "").includes("THROTTLED")
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>, cache: RequestCache = "no-store"): Promise<T> {
  if (!shopifyConfigured) throw new Error("Shopify is not configured (SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_PRIVATE_TOKEN).")

  const ip = await buyerIp()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Shopify-Storefront-Private-Token": token!,
  }
  if (ip) headers["Shopify-Storefront-Buyer-IP"] = ip

  // Retry briefly if Shopify throttles or has a hiccup (common during a drop)
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://${domain}/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      cache,
    })
    const json = await res.json().catch(() => null)

    if (res.ok && json && !json.errors) return json.data as T

    const retryable = res.status === 429 || res.status >= 500 || isThrottled(json?.errors)
    if (retryable && attempt < 2) {
      await wait(400 * (attempt + 1) + Math.random() * 300)
      continue
    }
    const msg = json?.errors ? JSON.stringify(json.errors) : `HTTP ${res.status}`
    throw new Error(`Shopify Storefront API error: ${msg}`)
  }
}

// ---------- Fragments ----------

const IMAGE = `url altText width height`
const MONEY = `amount currencyCode`

const PRODUCT_FIELDS = `
  id handle title description descriptionHtml availableForSale
  featuredImage { ${IMAGE} }
  images(first: 10) { edges { node { ${IMAGE} } } }
  priceRange { minVariantPrice { ${MONEY} } }
  options { name values }
  variants(first: 50) {
    edges { node { id title availableForSale price { ${MONEY} } selectedOptions { name value } } }
  }
`

const CART_FIELDS = `
  id checkoutUrl totalQuantity
  cost { subtotalAmount { ${MONEY} } totalAmount { ${MONEY} } }
  lines(first: 100) {
    edges { node {
      id quantity
      cost { totalAmount { ${MONEY} } }
      merchandise { ... on ProductVariant {
        id title
        product { handle title featuredImage { ${IMAGE} } }
      } }
    } }
  }
`

type RawProduct = Omit<Product, "images" | "variants"> & { images: Edges<Image>; variants: Edges<Variant> }
type RawCart = Omit<Cart, "lines"> & { lines: Edges<CartLine> }

const normalizeProduct = (p: RawProduct): Product => ({ ...p, images: nodes(p.images), variants: nodes(p.variants) })
const normalizeCart = (c: RawCart): Cart => ({ ...c, lines: nodes(c.lines) })

// ---------- Products ----------

export async function getProducts(first = 50): Promise<Product[]> {
  const data = await shopifyFetch<{ products: Edges<RawProduct> }>(
    `query Products($first: Int!) { products(first: $first, sortKey: CREATED_AT, reverse: true) { edges { node { ${PRODUCT_FIELDS} } } } }`,
    { first },
  )
  return sortByCategory(nodes(data.products).map(normalizeProduct))
}

// Shop display order. Shopify has no reliable type/tags on these products, so the
// category is read from the title. Checked in this sequence (e.g. "LONGSLEEVE TEE"
// must hit longsleeve before tee); anything unmatched counts as an accessory.
const CATEGORY_ORDER: RegExp[] = [
  /\bHOOD(IE|Y|ED)S?\b/i, // hoodies
  /\bLONG[\s-]?SLEEVES?\b|\bL\/S\b/i, // longsleeves
  /\bSHORTS\b/i, // shorts (checked early so it never falls through), ranked below
  /\b(PANTS|TROUSERS|JOGGERS?|SWEATPANTS|JEANS)\b/i, // pants
  /\bT[\s-]?SHIRTS?\b|\bTEES?\b/i, // t-shirts
]
// Rank per matcher above: hoodies 0, longsleeves 1, shorts 4, pants 3, t-shirts 2; accessories 5
const CATEGORY_RANK = [0, 1, 4, 3, 2]

function categoryRank(title: string) {
  const i = CATEGORY_ORDER.findIndex((re) => re.test(title))
  return i === -1 ? 5 : CATEGORY_RANK[i]
}

// Stable: products in the same category keep Shopify's order (newest first)
const sortByCategory = (products: Product[]) =>
  [...products].sort((a, b) => categoryRank(a.title) - categoryRank(b.title))

export async function getProduct(handle: string): Promise<Product | null> {
  const data = await shopifyFetch<{ product: RawProduct | null }>(
    `query Product($handle: String!) { product(handle: $handle) { ${PRODUCT_FIELDS} } }`,
    { handle },
  )
  return data.product ? normalizeProduct(data.product) : null
}

// ---------- Cart ----------

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await shopifyFetch<{ cart: RawCart | null }>(`query Cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`, { id: cartId })
  return data.cart ? normalizeCart(data.cart) : null
}

type CartMutation = { cart: RawCart | null; userErrors: { message: string }[] }

function unwrap(result: CartMutation): Cart {
  if (result.userErrors?.length) throw new Error(result.userErrors.map((e) => e.message).join(", "))
  if (!result.cart) throw new Error("Shopify returned no cart")
  return normalizeCart(result.cart)
}

export async function createCart(lines: { merchandiseId: string; quantity: number }[] = []): Promise<Cart> {
  const data = await shopifyFetch<{ cartCreate: CartMutation }>(
    `mutation CartCreate($input: CartInput!) { cartCreate(input: $input) { cart { ${CART_FIELDS} } userErrors { message } } }`,
    { input: { lines } },
  )
  return unwrap(data.cartCreate)
}

export async function addCartLines(cartId: string, lines: { merchandiseId: string; quantity: number }[]): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesAdd: CartMutation }>(
    `mutation Add($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } } }`,
    { cartId, lines },
  )
  return unwrap(data.cartLinesAdd)
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesUpdate: CartMutation }>(
    `mutation Update($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } } }`,
    { cartId, lines: [{ id: lineId, quantity }] },
  )
  return unwrap(data.cartLinesUpdate)
}

export async function removeCartLine(cartId: string, lineId: string): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesRemove: CartMutation }>(
    `mutation Remove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } userErrors { message } } }`,
    { cartId, lineIds: [lineId] },
  )
  return unwrap(data.cartLinesRemove)
}

// ---------- Helpers ----------

// CDs (and other music formats) have full-bleed square cover art instead of a product shot on
// white, so they get shown smaller with a shadow to sit at a realistic scale next to clothing.
export const isCd = (title: string) => /\b(CD|VINYL|LP|CASSETTE|TAPE)\b/i.test(title)

// Classes for a CD cover inside a square frame: ~60% of the frame, centered, soft drop shadow
export const CD_COVER_CLASS = "p-[20%] drop-shadow-[0_10px_18px_rgba(0,0,0,0.22)]"

export function formatMoney({ amount, currencyCode }: Money) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: currencyCode }).format(Number(amount))
}
