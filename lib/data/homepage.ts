import { prisma } from "@/lib/db/prisma"
import { getProductPriceWithPromotion } from "@/lib/utils/promotions"

async function buildHomepageData() {
  const [featuredProducts, latestProducts, categories, activePromotions, blogPosts, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      take: 8,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      take: 8,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      take: 6,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    }),
    prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      take: 3,
      orderBy: { endDate: "asc" },
    }),
    prisma.blogPost
      ? prisma.blogPost.findMany({
          where: { isActive: true },
          take: 2,
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          select: { id: true, title: true, slug: true, excerpt: true, image: true, publishedAt: true },
        })
      : Promise.resolve([]),
    prisma.settings.findUnique({
      where: { id: "main" },
      select: { defaultBlogImage: true },
    }),
  ])

  const featuredWithPricing = await Promise.all(
    featuredProducts.map(async (product) => {
      const pricing = await getProductPriceWithPromotion(product.id)
      return { ...product, pricing }
    })
  )

  const latestWithPricing = await Promise.all(
    latestProducts.map(async (product) => {
      const pricing = await getProductPriceWithPromotion(product.id)
      return { ...product, pricing }
    })
  )

  return {
    featuredProducts: featuredWithPricing,
    latestProducts: latestWithPricing,
    categories,
    activePromotions,
    blogPosts: blogPosts ?? [],
    defaultBlogImage: settings?.defaultBlogImage ?? null,
  }
}

export type HomepageData = Awaited<ReturnType<typeof buildHomepageData>>

const emptyHomepageData: HomepageData = {
  featuredProducts: [],
  latestProducts: [],
  categories: [],
  activePromotions: [],
  blogPosts: [],
  defaultBlogImage: null,
}

/**
 * Ne propage jamais d’erreur : évite un 500 Next si MySQL est injoignable depuis Vercel.
 */
export async function loadHomepageDataSafe(): Promise<{
  data: HomepageData
  catalogLoadFailed: boolean
}> {
  try {
    const data = await buildHomepageData()
    return { data, catalogLoadFailed: false }
  } catch (err) {
    console.error("[loadHomepageDataSafe] Échec chargement catalogue :", err)
    return { data: emptyHomepageData, catalogLoadFailed: true }
  }
}
