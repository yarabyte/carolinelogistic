import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { requireRole } from "@/lib/auth/session"

export default async function AdminUsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireRole([UserRole.ADMIN])
  } catch {
    redirect("/admin/dashboard")
  }
  return <>{children}</>
}
