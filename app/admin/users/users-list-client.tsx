"use client"

import { useMemo, useState } from "react"
import type { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Edit,
  Search,
  UsersRound,
  Shield,
  Mail,
  Calendar,
  UserCheck,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export type AdminUserRow = {
  id: string
  name: string | null
  email: string
  role: UserRole
  isActive: boolean
  createdAt: Date | string
}

function roleLabel(role: UserRole) {
  const map: Record<UserRole, string> = {
    ADMIN: "Administrateur",
    MANAGER: "Gestionnaire",
    STAFF: "Équipe",
  }
  return map[role] ?? role
}

function roleBadgeClass(role: UserRole) {
  const map: Record<UserRole, string> = {
    ADMIN:
      "bg-red-100 text-red-900 ring-1 ring-red-200/80 dark:bg-red-950/50 dark:text-red-100 dark:ring-red-900/50",
    MANAGER:
      "bg-sky-100 text-sky-900 ring-1 ring-sky-200/80 dark:bg-sky-950/50 dark:text-sky-100 dark:ring-sky-800/50",
    STAFF:
      "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800/50",
  }
  return map[role] || "bg-muted text-muted-foreground ring-1 ring-border"
}

function statusBadgeClass(isActive: boolean) {
  return isActive
    ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800/50"
    : "bg-red-100 text-red-900 ring-1 ring-red-200/80 dark:bg-red-950/50 dark:text-red-100 dark:ring-red-800/50"
}

function initials(user: AdminUserRow) {
  const base = (user.name || user.email || "?").trim()
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2)
  }
  return base.slice(0, 2).toUpperCase()
}

function formatJoined(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function UsersListClient({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return initialUsers.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      if (statusFilter === "active" && !u.isActive) return false
      if (statusFilter === "inactive" && u.isActive) return false
      if (!q) return true
      const name = (u.name || "").toLowerCase()
      return name.includes(q) || u.email.toLowerCase().includes(q)
    })
  }, [initialUsers, search, roleFilter, statusFilter])

  const stats = useMemo(() => {
    const active = initialUsers.filter((u) => u.isActive).length
    const admins = initialUsers.filter((u) => u.role === "ADMIN").length
    return {
      total: initialUsers.length,
      active,
      inactive: initialUsers.length - active,
      admins,
    }
  }, [initialUsers])

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <UsersRound className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Utilisateurs
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                Comptes admin : rôles, accès au back-office et statut actif / désactivé.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="shrink-0 border-primary/30 bg-background/80 shadow-sm hover:bg-primary/5"
          >
            <Link href="/admin/users/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Link>
          </Button>
        </div>

        {initialUsers.length > 0 && (
          <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Comptes
              </p>
              <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                {stats.total}
              </p>
              <p className="text-xs text-muted-foreground">utilisateurs enregistrés</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actifs
              </p>
              <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                <UserCheck className="h-5 w-5 text-primary" />
                {stats.active}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.inactive > 0 ? `${stats.inactive} compte(s) désactivé(s)` : "tous peuvent se connecter"}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Administrateurs
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stats.admins}</p>
              <p className="text-xs text-muted-foreground">rôle plein accès</p>
            </div>
          </div>
        )}
      </div>

      <Card className="overflow-hidden border-2 border-border shadow-md">
        <CardHeader className="space-y-4 border-b border-border bg-muted/30 pb-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Mail className="h-5 w-5 text-primary" />
              Liste des utilisateurs
            </CardTitle>
            <CardDescription>
              Recherche par nom ou e-mail, filtres par rôle et statut (côté client).
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="relative min-w-0 flex-1 lg:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nom ou e-mail…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 border-border/80 bg-background pl-10 shadow-inner"
              />
            </div>
            <div className="flex w-full flex-col gap-1 sm:w-44 lg:w-48">
              <label htmlFor="user-role" className="text-xs font-medium text-muted-foreground">
                Rôle
              </label>
              <select
                id="user-role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">Tous les rôles</option>
                <option value="ADMIN">Administrateur</option>
                <option value="MANAGER">Gestionnaire</option>
                <option value="STAFF">Équipe</option>
              </select>
            </div>
            <div className="flex w-full flex-col gap-1 sm:w-44 lg:w-48">
              <label htmlFor="user-status" className="text-xs font-medium text-muted-foreground">
                Statut
              </label>
              <select
                id="user-status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "active" | "inactive")
                }
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">Tous</option>
                <option value="active">Actifs uniquement</option>
                <option value="inactive">Inactifs uniquement</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {initialUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-b-xl border-t border-dashed border-border bg-muted/15 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <UsersRound className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Aucun utilisateur</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Créez un compte pour permettre la connexion au back-office.
              </p>
              <Button asChild className="mt-6">
                <Link href="/admin/users/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel utilisateur
                </Link>
              </Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-b-xl border-t border-dashed border-border bg-muted/15 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Aucun résultat</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Modifiez la recherche ou les filtres.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Utilisateur
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Rôle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Création
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/80 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-4 align-top sm:px-6">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-xs font-semibold text-muted-foreground">
                            {initials(user)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">{user.name || "—"}</p>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top sm:px-6">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            roleBadgeClass(user.role)
                          )}
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top sm:px-6">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            statusBadgeClass(user.isActive)
                          )}
                        >
                          {user.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top sm:px-6">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                          {formatJoined(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right align-top sm:px-6">
                        <Button variant="outline" size="sm" className="shadow-sm" asChild>
                          <Link href={`/admin/users/${user.id}/edit`}>
                            <Edit className="mr-1.5 h-3.5 w-3.5" />
                            Modifier
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
