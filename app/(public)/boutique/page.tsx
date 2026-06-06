"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Breadcrumb } from "@/components/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, ShoppingCart, Star, Filter, Grid3X3, List, ChevronDown, Search, Eye } from "lucide-react"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getProductUrl } from "@/lib/utils"
import { resolveImageUrl } from "@/lib/utils/image-url"
import { AddToCartButton } from "@/components/shop/add-to-cart-button"
import { WishlistButton } from "@/components/shop/wishlist-button"

interface Product {
  id: string
  title: string
  price: number
  images: string[] | unknown
  category: { name: string; slug: string } | null
  isPartner: boolean
  isFeatured: boolean
  stock?: number
  externalLink?: string | null
  slug?: string | null
  pricing?: { price: number; originalPrice: number; promotionId: string | null } | null
}

interface Category {
  id: string
  name: string
  slug: string
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
}

function BoutiquePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [priceMin, setPriceMin] = useState(0)
  const [priceMax, setPriceMax] = useState(500)
  const [promoOnly, setPromoOnly] = useState(false)
  const PRICE_MAX_LIMIT = 500
  const [sortBy, setSortBy] = useState("relevance")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      })
      if (search) params.append("search", search)
      if (selectedCategory) params.append("categoryId", selectedCategory)

      // Handle sorting
      let sortByParam = "createdAt"
      let sortOrderParam = "desc"
      if (sortBy === "price-asc") {
        sortByParam = "price"
        sortOrderParam = "asc"
      } else if (sortBy === "price-desc") {
        sortByParam = "price"
        sortOrderParam = "desc"
      } else if (sortBy === "newest") {
        sortByParam = "createdAt"
        sortOrderParam = "desc"
      } else if (sortBy === "relevance") {
        // For relevance, prioritize search matches, then by featured
        sortByParam = "isFeatured"
        sortOrderParam = "desc"
      }

      params.append("sortBy", sortByParam)
      params.append("sortOrder", sortOrderParam)

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      let list: Product[] = data.products || []
      setTotalPages(data.pagination?.totalPages || 1)

      // Fetch pricing for products with promos
      if (list.length > 0) {
        try {
          const pricingRes = await fetch("/api/products/pricing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productIds: list.map((p: Product) => p.id) }),
          })
          const pricingMap = await pricingRes.json()
          list = list.map((p) => {
            const pr = pricingMap[p.id]
            if (!pr || pr.price >= pr.originalPrice) return p
            return { ...p, pricing: pr }
          })
        } catch {
          // ignore
        }
      }
      setProducts(list)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Read search param from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search")
    if (urlSearch && urlSearch !== search) {
      setSearch(urlSearch)
    }
  }, []) // Only on mount

  // Debounced search effect - updates URL when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Update URL
      const params = new URLSearchParams()
      if (search) {
        params.set("search", search)
      }
      const newUrl = search ? `/boutique?${params.toString()}` : "/boutique"
      router.replace(newUrl, { scroll: false })
      // Reset to page 1 when search changes
      setPage(1)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [search])

  // Fetch products when page, search, category, or sort changes
  useEffect(() => {
    fetchProducts()
  }, [page, search, selectedCategory, sortBy])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Reset to first page
    fetchProducts()
  }

  const getProductImage = (product: Product) => {
    const images = Array.isArray(product.images) ? product.images : []
    const img = images[0]
    if (typeof img === "string") return resolveImageUrl(img)
    return undefined
  }

  const getDisplayPrice = (product: Product) => product.pricing?.price ?? product.price

  // Filter products by price and promo
  const filteredProducts = products.filter((product) => {
    const price = getDisplayPrice(product)
    // Price filter
    if (price < priceMin) return false
    if (priceMax < PRICE_MAX_LIMIT && price > priceMax) return false
    // Promo filter
    if (promoOnly && (!product.pricing || product.pricing.price >= product.pricing.originalPrice)) {
      return false
    }
    return true
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[
            { label: "Boutique", href: "/boutique" }
          ]} />
        </div>
        <section className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Notre Boutique</h1>
            <p className="text-muted-foreground mt-2">Découvrez notre sélection de produits de qualité</p>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              <aside className="lg:w-64 shrink-0">
                <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtres
                  </h3>

                  <form onSubmit={handleSearchSubmit} className="mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-3">Recherche</h4>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </form>

                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-3">Catégories</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === ""}
                          onChange={() => setSelectedCategory("")}
                          className="accent-primary"
                        />
                        <span className="text-sm text-muted-foreground hover:text-foreground">Toutes</span>
                      </label>
                      {categories.map((cat) => (
                        <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="category"
                            checked={selectedCategory === cat.id}
                            onChange={() => setSelectedCategory(cat.id)}
                            className="accent-primary"
                          />
                          <span className="text-sm text-muted-foreground hover:text-foreground">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-3">Prix</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{priceMin} €</span>
                        <span>{priceMax === PRICE_MAX_LIMIT ? `${PRICE_MAX_LIMIT}+ €` : `${priceMax} €`}</span>
                      </div>
                      <div className="relative h-2">
                        {/* Track background */}
                        <div className="absolute inset-0 bg-muted rounded-full" />
                        {/* Active track */}
                        <div
                          className="absolute h-full bg-primary rounded-full"
                          style={{
                            left: `${(priceMin / PRICE_MAX_LIMIT) * 100}%`,
                            right: `${100 - (priceMax / PRICE_MAX_LIMIT) * 100}%`,
                          }}
                        />
                        {/* Min slider */}
                        <input
                          type="range"
                          min={0}
                          max={PRICE_MAX_LIMIT}
                          step={10}
                          value={priceMin}
                          onChange={(e) => {
                            const val = Math.min(Number(e.target.value), priceMax - 10)
                            setPriceMin(val)
                          }}
                          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
                        />
                        {/* Max slider */}
                        <input
                          type="range"
                          min={0}
                          max={PRICE_MAX_LIMIT}
                          step={10}
                          value={priceMax}
                          onChange={(e) => {
                            const val = Math.max(Number(e.target.value), priceMin + 10)
                            setPriceMax(val)
                          }}
                          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
                        />
                      </div>
                      {/* Input fields */}
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={priceMax - 10}
                          value={priceMin}
                          onChange={(e) => setPriceMin(Math.min(Number(e.target.value) || 0, priceMax - 10))}
                          className="h-8 text-center text-sm"
                          placeholder="Min"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="number"
                          min={priceMin + 10}
                          max={PRICE_MAX_LIMIT}
                          value={priceMax}
                          onChange={(e) => setPriceMax(Math.max(Number(e.target.value) || PRICE_MAX_LIMIT, priceMin + 10))}
                          className="h-8 text-center text-sm"
                          placeholder="Max"
                        />
                      </div>
                      {/* Reset button */}
                      {(priceMin > 0 || priceMax < PRICE_MAX_LIMIT) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            setPriceMin(0)
                            setPriceMax(PRICE_MAX_LIMIT)
                          }}
                        >
                          Réinitialiser le prix
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={promoOnly}
                        onChange={(e) => setPromoOnly(e.target.checked)}
                        className="accent-primary"
                      />
                      <span className="text-sm text-muted-foreground">En promotion uniquement</span>
                    </label>
                  </div>
                </div>
              </aside>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <p className="text-muted-foreground text-sm">
                    {loading ? "Chargement..." : `Affichage de ${filteredProducts.length} produit(s)`}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 border border-border rounded ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 border border-border rounded ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Trier par:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-border rounded text-sm bg-background"
                      >
                        <option value="relevance">Pertinence</option>
                        <option value="price-asc">Prix croissant</option>
                        <option value="price-desc">Prix décroissant</option>
                        <option value="newest">Plus récent</option>
                      </select>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">Chargement...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Aucun produit trouvé</div>
                ) : (
                  <>
                    <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6" : "space-y-4"}>
                      {filteredProducts.map((product) => {
                        const imageSrc = getProductImage(product) || "/placeholder.svg"
                        const displayPrice = getDisplayPrice(product)
                        const isPartner = product.isPartner && product.externalLink
                        return (
                          <div
                            key={product.id}
                            className={`group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all flex flex-col ${viewMode === "list" ? "flex-row" : ""}`}
                          >
                            <Link
                              href={getProductUrl(product)}
                              className={`relative block ${viewMode === "list" ? "w-32 h-32 shrink-0" : "aspect-square"} bg-muted`}
                            >
                              {Array.isArray(product.images) && product.images.length > 0 ? (
                                <Image
                                  src={imageSrc}
                                  alt={product.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-2xl font-bold text-primary">
                                    {product.title.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div className="absolute top-2 right-2">
                                <WishlistButton productId={product.id} size="icon" variant="ghost" className="w-8 h-8 bg-card/90 rounded-full shadow hover:bg-primary hover:text-primary-foreground" />
                              </div>
                            </Link>

                            <div className="p-4 flex-1 flex flex-col">
                              <p className="text-xs text-muted-foreground">{product.category?.name || "Sans catégorie"}</p>
                              <Link href={getProductUrl(product)}>
                                <h3 className="font-medium text-foreground mt-1 line-clamp-2 text-sm group-hover:text-primary transition-colors">
                                  {product.title}
                                </h3>
                              </Link>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {product.pricing?.originalPrice && product.pricing.originalPrice > displayPrice ? (
                                  <>
                                    <span className="text-sm text-muted-foreground line-through">
                                      {formatPrice(product.pricing.originalPrice)}
                                    </span>
                                    <span className="font-bold text-primary">
                                      {formatPrice(displayPrice)}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-semibold">
                                      -{Math.round(((product.pricing.originalPrice - displayPrice) / product.pricing.originalPrice) * 100)}%
                                    </span>
                                  </>
                                ) : (
                                  <span className="font-bold text-primary">{formatPrice(displayPrice)}</span>
                                )}
                              </div>
                              <div className="mt-3 flex gap-2">
                                {isPartner ? (
                                  <Button size="sm" variant="outline" className="flex-1" asChild>
                                    <a href={product.externalLink!} target="_blank" rel="noopener noreferrer">
                                      <Eye className="w-4 h-4 mr-1" />
                                      Voir
                                    </a>
                                  </Button>
                                ) : (
                                  <>
                                    <Button size="sm" variant="outline" className="flex-1" asChild>
                                      <Link href={getProductUrl(product)}>
                                        <Eye className="w-4 h-4 mr-1" />
                                        Voir
                                      </Link>
                                    </Button>
                                    <AddToCartButton
                                      productId={product.id}
                                      title={product.title}
                                      price={displayPrice}
                                      image={getProductImage(product)}
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

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-10">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Précédent
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <Button
                            key={p}
                            size="sm"
                            variant={page === p ? "default" : "outline"}
                            onClick={() => setPage(p)}
                            className={page === p ? "bg-primary text-primary-foreground" : ""}
                          >
                            {p}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
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
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default function BoutiquePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <BoutiquePageContent />
    </Suspense>
  )
}
