"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { BlogPost } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Newspaper,
  Calendar,
  FileText,
  Link2,
  Eye,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

function postImageSrc(image: string | null) {
  if (!image) return ""
  if (image.startsWith("http") || image.startsWith("/")) return image
  return `/${image}`
}

function statusBadgeClass(isActive: boolean) {
  return isActive
    ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800/50"
    : "bg-muted text-muted-foreground ring-1 ring-border"
}

function formatDate(value: Date | string | null) {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function BlogListClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return posts.filter((p) => {
      if (statusFilter === "active" && !p.isActive) return false
      if (statusFilter === "inactive" && p.isActive) return false
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.excerpt || "").toLowerCase().includes(q)
      )
    })
  }, [posts, search, statusFilter])

  const stats = useMemo(() => {
    const active = posts.filter((p) => p.isActive).length
    const withPublishedAt = posts.filter((p) => p.publishedAt != null).length
    return {
      total: posts.length,
      active,
      inactive: posts.length - active,
      withPublishedAt,
    }
  }, [posts])

  const doDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" })
      if (res.ok) router.refresh()
      else {
        const err = (await res.json()) as { error?: string }
        alert(err.error || "Erreur")
      }
    } catch {
      alert("Erreur lors de la suppression")
    } finally {
      setConfirmOpen(false)
      setPendingDeleteId(null)
    }
  }

  const handleConfirmDelete = () => {
    if (pendingDeleteId) void doDelete(pendingDeleteId)
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Newspaper className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Blog</h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                Articles affichés sur la page blog et jusqu&apos;à quatre extraits sur l&apos;accueil
                (articles actifs récents).
              </p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="shrink-0 border-primary/30 bg-background/80 shadow-sm hover:bg-primary/5"
          >
            <Link href="/admin/blog/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvel article
            </Link>
          </Button>
        </div>

        {posts.length > 0 && (
          <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Articles
              </p>
              <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                {stats.total}
              </p>
              <p className="text-xs text-muted-foreground">chargés (100 max.)</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actifs
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stats.active}</p>
              <p className="text-xs text-muted-foreground">
                {stats.inactive > 0 ? `${stats.inactive} brouillon(s) / masqués` : "tous visibles si publiés"}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Date de publication
              </p>
              <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                {stats.withPublishedAt}
              </p>
              <p className="text-xs text-muted-foreground">articles avec une date renseignée</p>
            </div>
          </div>
        )}
      </div>

      <Card className="overflow-hidden border-2 border-border shadow-md">
        <CardHeader className="space-y-4 border-b border-border bg-muted/30 pb-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Eye className="h-5 w-5 text-primary" />
              Articles
            </CardTitle>
            <CardDescription>
              Recherche locale sur titre, slug ou extrait. Filtre par statut.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Titre, slug ou extrait…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 border-border/80 bg-background pl-10 shadow-inner"
              />
            </div>
            <div className="flex w-full flex-col gap-1 sm:w-56 lg:w-64">
              <label htmlFor="blog-status" className="text-xs font-medium text-muted-foreground">
                Statut
              </label>
              <select
                id="blog-status"
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
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-b-xl border-t border-dashed border-border bg-muted/15 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Newspaper className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Aucun article</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Créez un premier article pour alimenter le blog et la section accueil.
              </p>
              <Button asChild className="mt-6">
                <Link href="/admin/blog/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel article
                </Link>
              </Button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-b-xl border-t border-dashed border-border bg-muted/15 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Aucun résultat</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Ajustez la recherche ou le filtre de statut.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Article
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Publication
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => {
                    const src = postImageSrc(post.image)
                    return (
                      <tr
                        key={post.id}
                        className="border-b border-border/80 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-4 align-top sm:px-6">
                          <div className="flex gap-3">
                            <div className="relative h-14 w-[7.5rem] shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                              {src ? (
                                <Image
                                  src={src}
                                  alt={post.title}
                                  fill
                                  className="object-cover"
                                  sizes="120px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-muted-foreground">
                                  Sans image
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">{post.title}</p>
                              <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-muted-foreground">
                                <Link2 className="h-3 w-3 shrink-0" />
                                <span className="truncate">/{post.slug}</span>
                              </p>
                              {post.excerpt && (
                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                  {post.excerpt}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top sm:px-6">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span>{formatDate(post.publishedAt)}</span>
                          </div>
                          <p className="mt-1 pl-6 text-xs text-muted-foreground">
                            Créé {formatDate(post.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top sm:px-6">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              statusBadgeClass(post.isActive)
                            )}
                          >
                            {post.isActive ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right align-top sm:px-6">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="shadow-sm" asChild>
                              <Link href={`/admin/blog/${post.id}/edit`}>
                                <Edit className="mr-1.5 h-3.5 w-3.5" />
                                Modifier
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => {
                                setPendingDeleteId(post.id)
                                setConfirmOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Supprimer</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer cet article ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false)
          setPendingDeleteId(null)
        }}
      />
    </div>
  )
}
