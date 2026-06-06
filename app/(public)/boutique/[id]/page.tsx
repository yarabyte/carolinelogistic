import { prisma } from "@/lib/db/prisma"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Heart, Eye } from "lucide-react"
import Image from "next/image"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Breadcrumb } from "@/components/breadcrumb"
import { getProductPriceWithPromotion } from "@/lib/utils/promotions"
import { CountdownTimer } from "@/components/shop/countdown-timer"
import { PartnerLinkButton } from "@/components/shop/partner-link-button"
import { PartnerTrackedLink } from "@/components/shop/partner-tracked-link"
import { AddToCartButton } from "@/components/shop/add-to-cart-button"
import { WishlistButton } from "@/components/shop/wishlist-button"
import { getProductUrl as getProductUrlUtil } from "@/lib/utils"
import { resolveImageUrl } from "@/lib/utils/image-url"
import type { Metadata } from "next"

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}): Promise<Metadata> {
  // Handle both sync and async params (Next.js 15+)
  const resolvedParams = await Promise.resolve(params)
  const identifier = resolvedParams.id

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: identifier },
        { id: identifier },
      ],
    },
    include: { category: true },
  })

  if (!product) {
    return {
      title: "Produit non trouvé",
    }
  }

  return {
    title: `${product.title} - Caroline Logistic`,
    description: product.description || `Découvrez ${product.title} sur Caroline Logistic`,
    openGraph: {
      title: product.title,
      description: product.description || undefined,
      images: product.images && Array.isArray(product.images) && product.images.length > 0
        ? [product.images[0]]
        : [],
    },
  }
}

async function getProduct(identifier: string) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: identifier },
        { id: identifier },
      ],
    },
    include: {
      category: true,
      partner: true,
      promotions: {
        include: {
          promotion: true,
        },
      },
    },
  })

  if (!product) {
    return null
  }

  // Track view for partner products
  if (product.isPartner) {
    await prisma.product.update({
      where: { id: product.id },
      data: { views: { increment: 1 } },
    })
  }

  return product
}

async function getSimilarProducts(productId: string, categoryId: string | null, limit: number = 4) {
  const excludedIds = new Set<string>([productId])
  type ProductSelect = {
    id: string
    title: string
    price: number
    images: any
    slug: string | null
    category: { id: string; name: string; slug: string | null } | null
    isPartner: boolean
    isFeatured: boolean
    stock: number
    externalLink: string | null
    views: number
    clicks: number
  }
  const similarProducts: ProductSelect[] = []

  // Catégories cibles : même catégorie + catégories sœurs (même parent)
  let targetCategoryIds: string[] = categoryId ? [categoryId] : []

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { parent: true, children: { select: { id: true } } },
    })

    if (category?.parentId) {
      // Sous-catégorie : inclure les sœurs
      const siblingIds = await prisma.category.findMany({
        where: { parentId: category.parentId },
        select: { id: true },
      })
      targetCategoryIds = siblingIds.map((c) => c.id)
    } else if (category?.children?.length) {
      // Catégorie racine : inclure les sous-catégories
      targetCategoryIds = [categoryId, ...category.children.map((c) => c.id)]
    }
  }

  if (targetCategoryIds.length === 0) {
    return []
  }

  // 1. Produits de la même catégorie en priorité (en stock)
  if (categoryId) {
    const sameCategoryProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        categoryId: categoryId,
        OR: [{ stock: { gt: 0 } }, { isPartner: true }],
      },
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        slug: true,
        category: { select: { id: true, name: true, slug: true } },
        isPartner: true,
        isFeatured: true,
        stock: true,
        externalLink: true,
        views: true,
        clicks: true,
      },
      take: limit * 2,
      orderBy: [
        { isFeatured: "desc" },
        { stock: "desc" },
        { views: "desc" },
        { clicks: "desc" },
        { createdAt: "desc" },
      ],
    })
    similarProducts.push(...sameCategoryProducts)
    sameCategoryProducts.forEach((p) => excludedIds.add(p.id))
  }

  // 2. Produits des catégories sœurs (même univers)
  if (similarProducts.length < limit && targetCategoryIds.length > 1) {
    const siblingCategoryIds = targetCategoryIds.filter((id) => id !== categoryId)
    if (siblingCategoryIds.length > 0) {
      const siblingProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { notIn: Array.from(excludedIds) },
          categoryId: { in: siblingCategoryIds },
          OR: [{ stock: { gt: 0 } }, { isPartner: true }],
        },
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          slug: true,
          category: { select: { id: true, name: true, slug: true } },
          isPartner: true,
          isFeatured: true,
          stock: true,
          externalLink: true,
          views: true,
          clicks: true,
        },
        take: limit - similarProducts.length,
        orderBy: [
          { isFeatured: "desc" },
          { stock: "desc" },
          { views: "desc" },
          { createdAt: "desc" },
        ],
      })
      similarProducts.push(...siblingProducts)
      siblingProducts.forEach((p) => excludedIds.add(p.id))
    }
  }

  // 3. Même catégorie sans filtre stock (pour avoir assez de produits cohérents)
  if (similarProducts.length < limit && categoryId) {
    const moreSameCategory = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { notIn: Array.from(excludedIds) },
        categoryId: categoryId,
      },
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        slug: true,
        category: { select: { id: true, name: true, slug: true } },
        isPartner: true,
        isFeatured: true,
        stock: true,
        externalLink: true,
        views: true,
        clicks: true,
      },
      take: limit - similarProducts.length,
      orderBy: [{ views: "desc" }, { createdAt: "desc" }],
    })
    similarProducts.push(...moreSameCategory)
  }

  // Limiter au nombre demandé et éviter les doublons
  const uniqueProducts = Array.from(
    new Map(similarProducts.map((p) => [p.id, p])).values()
  ).slice(0, limit)

  // Obtenir les prix avec promotions pour chaque produit
  const productsWithPricing = await Promise.all(
    uniqueProducts.map(async (product) => {
      const pricing = await getProductPriceWithPromotion(product.id)
      return { ...product, pricing }
    })
  )

  return productsWithPricing
}


export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  // Handle both sync and async params (Next.js 15+)
  const resolvedParams = await Promise.resolve(params)
  const identifier = resolvedParams.id

  const product = await getProduct(identifier)

  if (!product) {
    notFound()
  }

  const pricing = await getProductPriceWithPromotion(product.id)
  const hasPromotion = pricing.promotionId !== null
  const activePromotion = hasPromotion
    ? product.promotions.find((p) => p.promotion.id === pricing.promotionId)
        ?.promotion
    : null

  // Récupérer les produits similaires
  const similarProducts = await getSimilarProducts(product.id, product.categoryId)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[
            product.category ? { 
              label: product.category.name, 
              href: `/categories/${product.category.slug || product.category.id}` 
            } : { label: "Boutique", href: "/boutique" },
            { label: product.title }
          ].filter(Boolean) as any} />
        </div>
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Images */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-muted rounded-xl overflow-hidden max-w-sm mx-auto lg:max-w-md">
                  {(() => {
                    const images = Array.isArray(product.images) ? product.images : []
                    const mainImage = images.length > 0 ? images[0] : null
                    
                    if (mainImage) {
                      const imageSrc = resolveImageUrl(mainImage)
                      return (
                        <>
                          <Image
                            src={imageSrc}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                          {hasPromotion && pricing.originalPrice > pricing.price && (
                            <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg z-10">
                              -{Math.round(((pricing.originalPrice - pricing.price) / pricing.originalPrice) * 100)}%
                            </span>
                          )}
                        </>
                      )
                    }
                    return (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-primary">
                          {product.title.charAt(0)}
                        </span>
                      </div>
                    )
                  })()}
                </div>
                {(() => {
                  const images = Array.isArray(product.images) ? product.images : []
                  if (images.length > 1) {
                    return (
                      <div className="grid grid-cols-4 gap-4">
                        {images.slice(1, 5).map((img, idx) => {
                          const imageSrc = resolveImageUrl(img)
                          return (
                            <div key={idx} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                              <Image 
                                src={imageSrc} 
                                alt={`${product.title} ${idx + 2}`} 
                                fill 
                                className="object-cover" 
                              />
                            </div>
                          )
                        })}
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              {/* Details */}
              <div className="space-y-6">
                <div>
                  {product.category && (
                    <p className="text-sm text-muted-foreground mb-2">{product.category.name}</p>
                  )}
                  <h1 className="text-3xl font-bold text-foreground">{product.title}</h1>
                  {product.isPartner && product.partner && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">Partenaire:</span>
                      <span className="text-sm font-medium text-foreground">{product.partner.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-primary">
                        {formatPrice(pricing.price)}
                      </span>
                      {hasPromotion && pricing.originalPrice !== pricing.price && (
                        <span className="text-xl text-muted-foreground line-through">
                          {formatPrice(pricing.originalPrice)}
                        </span>
                      )}
                    </div>
                    {hasPromotion && activePromotion && (
                      <div className="mt-2">
                        <CountdownTimer endDate={activePromotion.endDate} />
                      </div>
                    )}
                  </div>
                </div>

                {product.description && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
                    <div 
                      className="text-muted-foreground prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  </div>
                )}

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {product.dimensions && (
                        <tr className="border-b border-border">
                          <td className="p-3 text-sm text-muted-foreground font-medium w-1/3">Dimensions</td>
                          <td className="p-3 text-sm text-foreground">{product.dimensions}</td>
                        </tr>
                      )}
                      {product.weight && (
                        <tr className="border-b border-border">
                          <td className="p-3 text-sm text-muted-foreground font-medium w-1/3">Poids</td>
                          <td className="p-3 text-sm text-foreground">{product.weight} g</td>
                        </tr>
                      )}
                      <tr className="border-b border-border">
                        <td className="p-3 text-sm text-muted-foreground font-medium w-1/3">Stock</td>
                        <td className="p-3 text-sm text-foreground">
                          {product.stock > 0 ? `${product.stock} disponible(s)` : "Rupture de stock"}
                        </td>
                      </tr>
                      {product.tva && (
                        <tr>
                          <td className="p-3 text-sm text-muted-foreground font-medium w-1/3">TVA</td>
                          <td className="p-3 text-sm text-foreground">{product.tva}%</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-4">
                  {product.isPartner && product.externalLink ? (
                    <PartnerLinkButton
                      productId={product.id}
                      externalLink={product.externalLink}
                    />
                  ) : (
                    <AddToCartButton
                      productId={product.id}
                      title={product.title}
                      price={pricing.price}
                      image={Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined}
                      disabled={product.stock === 0}
                    />
                  )}
                  <WishlistButton productId={product.id} size="lg" />
                </div>

                {product.isPartner && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      Ce produit est proposé par un partenaire. En cliquant sur le lien, vous serez redirigé vers le site du partenaire.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Produits similaires */}
        {similarProducts.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-foreground mb-6">Produits similaires</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {similarProducts.map((similarProduct) => {
                  const mainImage = Array.isArray(similarProduct.images) && similarProduct.images.length > 0 
                    ? similarProduct.images[0] 
                    : "/placeholder.svg"
                  const imageSrc = resolveImageUrl(mainImage)
                  const displayPrice = similarProduct.pricing?.price ?? similarProduct.price
                  const originalPrice = similarProduct.pricing?.originalPrice ?? null
                  const hasDiscount = similarProduct.pricing?.promotionId !== null && 
                    originalPrice != null && 
                    originalPrice > displayPrice
                  const discountPercent = hasDiscount && originalPrice && originalPrice > 0
                    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
                    : 0

                  return (
                    <div
                      key={similarProduct.id}
                      className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all"
                    >
                      {/* Image */}
                      <Link href={getProductUrlUtil(similarProduct)}>
                        <div className="relative aspect-square bg-muted">
                          <Image
                            src={imageSrc}
                            alt={similarProduct.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {hasDiscount && discountPercent > 0 && (
                            <span className="absolute top-2 left-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded">
                              -{discountPercent}%
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Content */}
                      <div className="p-4">
                        <p className="text-xs text-muted-foreground">{similarProduct.category?.name || "Sans catégorie"}</p>
                        <Link href={getProductUrlUtil(similarProduct)}>
                          <h3 className="font-medium text-foreground mt-1 line-clamp-2 text-sm group-hover:text-primary transition-colors">
                            {similarProduct.title}
                          </h3>
                        </Link>
                        {/* Price */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="font-bold text-primary">{formatPrice(displayPrice)}</span>
                          {hasDiscount && originalPrice && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPrice(originalPrice)}
                            </span>
                          )}
                        </div>
                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          {similarProduct.isPartner && similarProduct.externalLink ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1"
                              asChild
                            >
                              <PartnerTrackedLink
                                productId={similarProduct.id}
                                href={similarProduct.externalLink}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Voir
                              </PartnerTrackedLink>
                            </Button>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1"
                                asChild
                              >
                                <Link href={getProductUrlUtil(similarProduct)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir
                                </Link>
                              </Button>
                              <AddToCartButton
                                productId={similarProduct.id}
                                title={similarProduct.title}
                                price={displayPrice}
                                image={imageSrc}
                                size="sm"
                                className="flex-1"
                                disabled={similarProduct.stock === 0}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
