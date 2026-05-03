import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { requireRole } from "@/lib/auth/session"
import { HeroSlidesClient } from "./hero-slides-client"

export default async function HeroSlidesPage() {
  await requireRole([UserRole.ADMIN, UserRole.MANAGER])
  const slides = await prisma.heroSlide.findMany({
    orderBy: { sortOrder: "asc" },
  })

  return <HeroSlidesClient initialSlides={slides} />
}
