import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { resolveImageUrl } from "@/lib/utils/image-url"

interface Category {
  id: string
  name: string
  slug: string | null
  image: string | null
  description: string | null
  _count?: {
    products: number
  }
}

interface CategoriesSectionProps {
  categories?: Category[]
}

export function CategoriesSection({ categories = [] }: CategoriesSectionProps) {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Nos Catégories</h2>
            <p className="text-muted-foreground mt-1">Explorez notre large gamme de produits</p>
          </div>
          <Link
            href="/categories"
            className="hidden sm:flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => {
              const categorySlug = category.slug || category.id
              const imageSrc = resolveImageUrl(category.image)
              
              return (
                <Link
                  key={category.id}
                  href={`/categories/${categorySlug}`}
                  className="group relative rounded-xl overflow-hidden aspect-[4/3] hover:shadow-xl transition-all"
                >
                  <Image
                    src={imageSrc}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-semibold text-lg">
                      {category.name}
                    </h3>
                    <p className="text-sm text-white/80 mt-1">
                      {category._count?.products || 0} produit{category._count?.products !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Aucune catégorie disponible
          </div>
        )}

        {/* Mobile link */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Voir toutes les catégories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
