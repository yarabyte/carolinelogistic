import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Breadcrumb } from "@/components/breadcrumb"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { resolveImageUrl } from "@/lib/utils/image-url"

async function getCategories() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          _count: { select: { products: true } },
        },
      },
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  })
  return categories
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <Breadcrumb items={[{ label: "Catégories", href: "/categories" }]} />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-4">
              Nos Catégories
            </h1>
            <p className="text-muted-foreground mt-2">
              Explorez notre large gamme de produits par catégorie
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {categories.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.map((category) => {
                  const categorySlug = category.slug || category.id
                  const imageSrc = resolveImageUrl(category.image)
                  const productCount =
                    (category._count?.products || 0) +
                    category.children.reduce(
                      (sum, c) => sum + (c._count?.products || 0),
                      0
                    )

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
                        <h2 className="font-semibold text-lg">{category.name}</h2>
                        <p className="text-sm text-white/80 mt-1">
                          {productCount} produit{productCount !== 1 ? "s" : ""}
                        </p>
                        {category.children.length > 0 && (
                          <p className="text-xs text-white/70 mt-1">
                            {category.children.length} sous-catégorie
                            {category.children.length !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-6 h-6 text-white" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-16">
                <p className="text-lg">Aucune catégorie disponible pour le moment.</p>
                <Link
                  href="/boutique"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium mt-4"
                >
                  Voir la boutique
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
