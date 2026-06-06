"use client"

import { SessionProvider } from "@/components/providers/session-provider"
import { CartProvider } from "@/components/shop/cart-context"
import { WishlistProvider } from "@/components/shop/wishlist-context"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <WishlistProvider>{children}</WishlistProvider>
      </CartProvider>
    </SessionProvider>
  )
}
