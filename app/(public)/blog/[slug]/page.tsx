import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { resolveImageUrl } from "@/lib/utils/image-url"

async function getPost(slug: string) {
  const [post, settings] = await Promise.all([
    prisma.blogPost.findFirst({
      where: { slug, isActive: true },
    }),
    prisma.settings.findUnique({
      where: { id: "main" },
      select: { defaultBlogImage: true },
    }),
  ])
  return { post, defaultImage: settings?.defaultBlogImage ?? null }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const { slug } = await Promise.resolve(params)
  const { post, defaultImage } = await getPost(slug)

  if (!post) notFound()

  const imageUrl = resolveImageUrl(post.image, resolveImageUrl(defaultImage))

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:text-primary mb-6 inline-block"
        >
          ← Retour au blog
        </Link>

        <article>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {post.title}
          </h1>
          {post.publishedAt && (
            <p className="text-muted-foreground mt-2">
              {new Date(post.publishedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}

          <div className="relative aspect-video mt-8 rounded-lg overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>

          {post.excerpt && (
            <p className="text-lg text-muted-foreground mt-6 font-medium">
              {post.excerpt}
            </p>
          )}

          {post.content && (
            <div
              className="mt-6 prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          {!post.content && post.excerpt && (
            <p className="mt-6 text-foreground">{post.excerpt}</p>
          )}
        </article>
      </main>
      <Footer />
    </div>
  )
}
