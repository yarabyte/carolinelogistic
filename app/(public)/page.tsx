import type { HomepageData } from "@/lib/data/homepage"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/home/hero-section"
import { CategoriesSection } from "@/components/home/categories-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { PromotionBanner } from "@/components/home/promotion-banner"
import { AboutPreview } from "@/components/home/about-preview"
import { BlogSection } from "@/components/home/blog-section"

/** Limite côté plateforme ; laisser de la marge au-delà des timeouts MySQL (voir `lib/db/prisma.ts`). */
export const maxDuration = 60

const emptyHomepageData: HomepageData = {
  featuredProducts: [],
  latestProducts: [],
  categories: [],
  activePromotions: [],
  blogPosts: [],
  defaultBlogImage: null,
}

export default async function HomePage() {
  let data: HomepageData = emptyHomepageData
  let catalogLoadFailed = false
  try {
    const { loadHomepageDataSafe } = await import("@/lib/data/homepage")
    const result = await loadHomepageDataSafe()
    data = result.data
    catalogLoadFailed = result.catalogLoadFailed
  } catch (err) {
    console.error("[HomePage] Erreur critique (import Prisma / catalogue) :", err)
    catalogLoadFailed = true
    data = emptyHomepageData
  }

  return (
    <div className="min-h-screen flex flex-col" suppressHydrationWarning>
      {catalogLoadFailed && (
        <div
          role="status"
          className="bg-amber-500/15 text-amber-950 dark:text-amber-100 text-center text-sm py-2.5 px-4 border-b border-amber-500/25"
        >
          Le catalogue est momentanément indisponible (connexion base de données). Les autres pages peuvent encore
          fonctionner. Vérifiez les logs Vercel et l’accès MySQL depuis le cloud (IP, pare-feu, TLS).
        </div>
      )}
      <Header />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection categories={data.categories} />
        <FeaturedProducts products={data.featuredProducts} />
        <PromotionBanner promotions={data.activePromotions} />
        <BlogSection posts={data.blogPosts} defaultImage={data.defaultBlogImage} />
        <AboutPreview />
      </main>
      <Footer />
    </div>
  )
}
