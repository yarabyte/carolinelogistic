"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Breadcrumb } from "@/components/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ShoppingCart, Eye, Heart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AddToCartButton } from "@/components/shop/add-to-cart-button"
import { getProductUrl } from "@/lib/utils"
import { resolveImageUrl } from "@/lib/utils/image-url"

interface Product {
  id: string
  title: string
  price: number
  images: string[]
  category: { name: string; slug: string } | null
  isPartner: boolean
  isFeatured: boolean
  stock: number
  externalLink?: string | null
  pricing?: {
    price: number
    originalPrice: number
    promotionId: string | null
  }
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parent: { name: string; slug: string } | null
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
}

export default function CategoryPage() {
  const params = useParams()
  const categorySlugOrId = params.id as string
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await fetch(`/api/categories/${categorySlugOrId}`)
        if (!res.ok) {
          throw new Error("Category not found")
        }
        const data = await res.json()
        setCategory(data)
      } catch (error) {
        console.error("Error fetching category:", error)
      }
    }

    if (categorySlugOrId) {
      fetchCategory()
    }
  }, [categorySlugOrId])

  useEffect(() => {
    const fetchProducts = async () => {
      if (!category) {
        return
      }
      
      try {
        setLoading(true)
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          categoryId: category.id,
        })

        const res = await fetch(`/api/products?${params}`)
        const data = await res.json()
        const productsList = data.products || []
        
        // Get pricing with promotions for all products
        if (productsList.length > 0) {
          const productIds = productsList.map((p: any) => p.id)
          const pricingRes = await fetch("/api/products/pricing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productIds }),
          })
          const pricingMap = await pricingRes.json()
          
          const productsWithPricing = productsList.map((product: any) => ({
            ...product,
            pricing: pricingMap[product.id] || null,
          }))
          
          setProducts(productsWithPricing)
        } else {
          setProducts([])
        }
        setTotalPages(data.pagination?.totalPages || 1)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category, page])

  if (loading && !category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-muted-foreground">Chargement...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Catégorie non trouvée</h1>
            <Button asChild>
              <Link href="/boutique">Retour à la boutique</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const imageSrc = resolveImageUrl(category.image)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[
            { label: "Boutique", href: "/boutique" },
            category.parent ? { label: category.parent.name, href: `/categories/${category.parent.slug || category.parent.name.toLowerCase().replace(/\s+/g, '-')}` } : null,
            { label: category.name }
          ].filter(Boolean) as any} />
        </div>

        {/* Category Header */}
        <section className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative w-full md:w-64 h-48 md:h-48 rounded-xl overflow-hidden bg-card">
                <Image
                  src={imageSrc}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                {category.parent && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {category.parent.name}
                  </p>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-muted-foreground text-lg">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="text-center text-muted-foreground py-12">
                Chargement des produits...
              </div>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    Aucun produit disponible dans cette catégorie
                  </p>
                  <Button asChild>
                    <Link href="/boutique">Voir tous les produits</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
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
                        <Link href={getProductUrl(product)}>
                          <div className="relative aspect-square bg-muted">
                            <Image
                              src={imageSrc}
                              alt={product.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
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
                          </div>
                        </Link>

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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Précédent
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                      Page {page} sur {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
