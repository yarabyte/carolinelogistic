"use client"

import { Button } from "@/components/ui/button"
import { Heart, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AddToCartButton } from "@/components/shop/add-to-cart-button"
import { WishlistButton } from "@/components/shop/wishlist-button"
import { getProductUrl } from "@/lib/utils"
import { resolveImageUrl } from "@/lib/utils/image-url"

interface Product {
  id: string
  title: string
  price: number
  stock: number
  images: string[]
  slug?: string | null
  category: { name: string; slug: string } | null
  isFeatured: boolean
  isPartner: boolean
  externalLink?: string | null
  pricing?: {
    price: number
    originalPrice: number
    promotionId: string | null
  }
}

interface FeaturedProductsProps {
  products?: Product[]
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
}

export function FeaturedProducts({ products = [] }: FeaturedProductsProps) {
  // Si aucun produit n'est fourni, ne rien afficher
  if (products.length === 0) {
    return null
  }
  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Produits en Vedette</h2>
          <p className="text-muted-foreground mt-2">Découvrez nos meilleures sélections</p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            const mainImage = Array.isArray(product.images) && product.images.length > 0 
              ? product.images[0] 
              : "/placeholder.svg"
            const imageSrc = resolveImageUrl(mainImage)
            const displayPrice = product.pricing?.price || product.price
            const originalPrice = product.pricing?.originalPrice || null
            const hasDiscount = product.pricing?.promotionId !== null && originalPrice && originalPrice > displayPrice

            return (
              <div
                key={product.id}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all"
              >
                {/* Image */}
                <div className="relative aspect-square bg-muted">
                  <Link href={getProductUrl(product)}>
                    <Image
                      src={imageSrc}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  {/* Badge */}
                  {hasDiscount && originalPrice && (
                    <span className="absolute top-2 left-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded">
                      -{Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
                    </span>
                  )}
                  {product.isFeatured && !hasDiscount && (
                    <span className="absolute top-2 left-2 bg-[#6ea935] text-white text-xs font-medium px-2 py-1 rounded">
                      En vedette
                    </span>
                  )}
                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <WishlistButton 
                      productId={product.id} 
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 bg-card rounded-full shadow hover:bg-primary hover:text-primary-foreground"
                    />
                    <Link 
                      href={getProductUrl(product)}
                      className="w-8 h-8 bg-card rounded-full shadow flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">{product.category?.name || "Sans catégorie"}</p>
                  <Link href={getProductUrl(product)}>
                    <h3 className="font-medium text-foreground mt-1 line-clamp-2 text-sm group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  {/* Price */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-bold text-primary">{formatPrice(displayPrice)}</span>
                    {originalPrice && originalPrice > displayPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    {product.isPartner && product.externalLink ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        asChild
                      >
                        <a
                          href={product.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={async () => {
                            // Track click
                            try {
                              await fetch(`/api/tracking/product/${product.id}`, {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ type: "click" }),
                              })
                            } catch (error) {
                              console.error("Failed to track click:", error)
                            }
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir
                        </a>
                      </Button>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                          asChild
                        >
                          <Link href={getProductUrl(product)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir
                          </Link>
                        </Button>
                        <AddToCartButton
                          productId={product.id}
                          title={product.title}
                          price={displayPrice}
                          image={imageSrc}
                          size="sm"
                          className="flex-1"
                          disabled={product.stock === 0}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* View all */}
        <div className="text-center mt-10">
          <Button asChild variant="outline" size="lg">
            <Link href="/boutique">Voir tous les produits</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
