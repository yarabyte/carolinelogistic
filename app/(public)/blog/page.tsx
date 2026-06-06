import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import Image from "next/image"
import { resolveImageUrl } from "@/lib/utils/image-url"

async function getBlogData() {
  const [posts, settings] = await Promise.all([
    prisma.blogPost.findMany({
      where: { isActive: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.settings.findUnique({
      where: { id: "main" },
      select: { defaultBlogImage: true },
    }),
  ])
  return { posts, defaultImage: settings?.defaultBlogImage ?? null }
}

export default async function BlogListPage() {
  const { posts, defaultImage } = await getBlogData()
  const imageFallback = defaultImage || "/placeholder.jpg"

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">Blog</h1>
          <p className="text-muted-foreground mt-2">
            Actualités et articles
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">Aucun article pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const imageSrc = resolveImageUrl(post.image, imageFallback)

              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group block rounded-lg border border-border bg-background overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className="relative aspect-[16/10] bg-muted">
                    <Image
                      src={imageSrc}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    {post.publishedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(post.publishedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    <span className="inline-block mt-2 text-sm font-medium text-primary group-hover:underline">
                      Lire la suite →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
