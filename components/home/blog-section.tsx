import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Calendar } from "lucide-react"
import { resolveImageUrl } from "@/lib/utils/image-url"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image: string | null
  publishedAt: string | null
}

interface BlogSectionProps {
  posts: BlogPost[]
  defaultImage: string | null
}

export function BlogSection({ posts, defaultImage }: BlogSectionProps) {
  const imageFallback = defaultImage || "/placeholder.jpg"

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30" id="blog">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <span className="inline-block text-sm font-medium text-primary mb-2 uppercase tracking-wider">
              Notre Blog
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Dernières Actualités
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl">
              Restez informé des tendances logistiques, conseils e-commerce et actualités de Caroline Logistic.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
          >
            Voir tous les articles
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground mb-4">Aucun article pour le moment.</p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Découvrir le blog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {posts.map((post, index) => {
              const imageSrc = resolveImageUrl(post.image, imageFallback)
              const href = `/blog/${post.slug}`

              return (
                <Link
                  key={post.id}
                  href={href}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={imageSrc}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Badge "Nouveau" for first article */}
                    {index === 0 && (
                      <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                        Nouveau
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-6">
                    {/* Date */}
                    {post.publishedAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="w-4 h-4" />
                        <time dateTime={new Date(post.publishedAt).toISOString()}>
                          {new Date(post.publishedAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </time>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-muted-foreground line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>
                    )}

                    {/* CTA */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                      <span className="text-sm font-medium text-primary group-hover:underline">
                        Lire l&apos;article
                      </span>
                      <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
