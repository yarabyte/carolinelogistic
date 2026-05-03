import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { requireRole } from "@/lib/auth/session"
import { BlogListClient } from "./blog-list-client"

export default async function BlogPage() {
  await requireRole([UserRole.ADMIN, UserRole.MANAGER])
  const posts = await prisma.blogPost.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  })

  return <BlogListClient initialPosts={posts} />
}
