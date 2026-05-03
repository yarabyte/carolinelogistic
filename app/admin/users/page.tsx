import { prisma } from "@/lib/db/prisma"
import { UsersListClient } from "./users-list-client"

export default async function UsersPage() {
  const initialUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return <UsersListClient initialUsers={initialUsers} />
}
