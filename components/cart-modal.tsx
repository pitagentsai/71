"use client"

import { X, Plus, Minus, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useCart } from "@/contexts/cart-context"

const SHOPIFY_CHECKOUT_URL = process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT_URL || 'https://merchismore.myshopify.com/cart'

interface CartModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CartModal({ open, onOpenChange }: CartModalProps) {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right"
        className="bg-black border-l-2 border-white text-white font-mono font-light w-full sm:max-w-md p-0 flex flex-col [&>button]:text-white [&>button]:hover:text-black [&>button]:hover:bg-white [&>button]:border-2 [&>button]:border-white [&>button]:absolute [&>button]:top-4 [&>button]:right-4"
      >
        <SheetTitle className="sr-only">Shopping Cart</SheetTitle>
        <div className="flex justify-center pt-6 pb-4">
          <img 
            src="/rysowane.png" 
            alt="Logo" 
            className="h-12 w-auto brightness-0 invert"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {cartItems.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-white/70 tracking-wider">CART IS EMPTY</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="border-2 border-white p-4 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="text-sm tracking-wider text-white/70">
                        [{String(item.id).padStart(3, '0')}]
                      </div>
                      <h3 className="text-lg font-light tracking-wider uppercase text-white">
                        {item.name}
                      </h3>
                      <div className="text-base font-light tracking-wider text-white">
                        {item.price}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 border-2 border-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-white hover:text-black transition-all"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 text-sm tracking-wider">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-white hover:text-black transition-all"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 border-2 border-white hover:bg-white hover:text-black transition-all"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t-2 border-white p-6 space-y-4 bg-black">
            <div className="flex justify-between items-center">
              <span className="text-lg font-light tracking-wider uppercase">TOTAL</span>
              <span className="text-xl font-light tracking-wider">{getTotalPrice()}</span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={clearCart}
                className="flex-1 border-2 border-white bg-black text-white font-mono font-light text-sm tracking-wider py-3 hover:bg-white hover:text-black transition-all duration-200 uppercase"
              >
                CLEAR CART
              </button>
              <button
                onClick={async () => {
                  try {
                    // Create checkout via Storefront API
                    const response = await fetch('/api/checkout', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        items: cartItems.map(item => ({
                          id: item.id,
                          variantId: item.variantId || `gid://shopify/ProductVariant/${item.id}`, // Use stored variant ID or fallback
                          quantity: item.quantity,
                        })),
                      }),
                    })

                    const data = await response.json()
                    
                    if (data.checkoutUrl) {
                      window.location.href = data.checkoutUrl
                    } else {
                      // Fallback to cart URL
                      window.location.href = SHOPIFY_CHECKOUT_URL
                    }
                  } catch (error) {
                    console.error('Error creating checkout:', error)
                    // Fallback to cart URL
                    window.location.href = SHOPIFY_CHECKOUT_URL
                  }
                }}
                className="flex-1 border-2 border-white bg-black text-white font-mono font-light text-sm tracking-wider py-3 hover:bg-white hover:text-black transition-all duration-200 uppercase"
              >
                CHECKOUT
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

