"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Percent,
  Tag,
  Loader2,
  Search,
  Layers,
  Package,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Promotion {
  id: string
  type: string
  name: string
  startDate: string
  endDate: string
  discountType: string
  discountValue: number
  isActive: boolean
  products: { id: string }[]
  categories: { id: string }[]
}

function getPromotionTypeLabel(type: string) {
  const labels: Record<string, string> = {
    HOT_DEAL: "Hot Deal",
    WEEKLY: "Hebdomadaire",
    PRODUCT: "Produit",
    CATEGORY: "Catégorie",
  }
  return labels[type] || type
}

function formatDiscount(discountType: string, value: number) {
  return discountType === "PERCENTAGE"
    ? `${value}%`
    : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value)
}

function scheduleStatus(p: Promotion): "live" | "upcoming" | "inactive" {
  const now = new Date()
  const start = new Date(p.startDate)
  const end = new Date(p.endDate)
  if (!p.isActive) return "inactive"
  if (now < start) return "upcoming"
  if (now > end) return "inactive"
  return "live"
}

function scheduleBadgeClass(status: "live" | "upcoming" | "inactive") {
  if (status === "live") {
    return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800/50"
  }
  if (status === "upcoming") {
    return "bg-sky-100 text-sky-900 ring-1 ring-sky-200/80 dark:bg-sky-950/50 dark:text-sky-100 dark:ring-sky-800/50"
  }
  return "bg-muted text-muted-foreground ring-1 ring-border"
}

function scheduleLabel(status: "live" | "upcoming" | "inactive") {
  if (status === "live") return "En cours"
  if (status === "upcoming") return "À venir"
  return "Inactive / terminée"
}

function typeBadgeClass(type: string) {
  const map: Record<string, string> = {
    HOT_DEAL: "bg-rose-100 text-rose-900 ring-1 ring-rose-200/80 dark:bg-rose-950/40 dark:text-rose-100 dark:ring-rose-900/50",
    WEEKLY: "bg-violet-100 text-violet-900 ring-1 ring-violet-200/80 dark:bg-violet-950/40 dark:text-violet-100 dark:ring-violet-900/50",
    PRODUCT: "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-900/50",
    CATEGORY: "bg-teal-100 text-teal-900 ring-1 ring-teal-200/80 dark:bg-teal-950/40 dark:text-teal-100 dark:ring-teal-900/50",
  }
  return (
    map[type] ||
    "bg-primary/10 text-primary ring-1 ring-primary/20"
  )
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "live" | "upcoming" | "inactive">(
    "all"
  )
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const fetchPromotions = async () => {
    try {
      const res = await fetch("/api/promotions")
      const data = await res.json()
      setPromotions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching promotions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchPromotions()
  }, [])

  const filteredPromotions = useMemo(() => {
    const q = search.trim().toLowerCase()
    return promotions.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false
      const status = scheduleStatus(p)
      if (scheduleFilter !== "all" && status !== scheduleFilter) return false
      if (!q) return true
      return p.name.toLowerCase().includes(q) || getPromotionTypeLabel(p.type).toLowerCase().includes(q)
    })
  }, [promotions, search, typeFilter, scheduleFilter])

  const stats = useMemo(() => {
    const live = promotions.filter((p) => scheduleStatus(p) === "live").length
    const upcoming = promotions.filter((p) => scheduleStatus(p) === "upcoming").length
    const productLinks = promotions.reduce((s, p) => s + (p.products?.length ?? 0), 0)
    return {
      total: promotions.length,
      live,
      upcoming,
      productLinks,
    }
  }, [promotions])

  const doDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/promotions/${id}`, { method: "DELETE" })
      if (res.ok) void fetchPromotions()
      else {
        const error = (await res.json()) as { error?: string }
        alert(error.error || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Error deleting promotion:", error)
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
              <Tag className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Promotions
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                Offres limitées dans le temps, remises sur produits ou catégories, visibles sur la
                boutique.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="shrink-0 border-primary/30 bg-background/80 shadow-sm hover:bg-primary/5"
          >
            <Link href="/admin/promotions/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle promotion
            </Link>
          </Button>
        </div>

        {!loading && promotions.length > 0 && (
          <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                <Layers className="h-5 w-5 text-primary" />
                {stats.total}
              </p>
              <p className="text-xs text-muted-foreground">promotions enregistrées</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                En cours
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stats.live}</p>
              <p className="text-xs text-muted-foreground">actives dans la fenêtre de dates</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                À venir
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stats.upcoming}</p>
              <p className="text-xs text-muted-foreground">date de début future</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Liens produits
              </p>
              <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                <Package className="h-5 w-5 text-primary" />
                {stats.productLinks}
              </p>
              <p className="text-xs text-muted-foreground">lignes produit liées (toutes promos)</p>
            </div>
          </div>
        )}
      </div>

      <Card className="overflow-hidden border-2 border-border shadow-md">
        <CardHeader className="space-y-4 border-b border-border bg-muted/30 pb-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Percent className="h-5 w-5 text-primary" />
              Liste des promotions
            </CardTitle>
            <CardDescription className="mt-1">
              Recherche par nom, filtre par type et par état calendaire (côté client).
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="relative min-w-0 flex-1 lg:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nom ou type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 border-border/80 bg-background pl-10 shadow-inner"
              />
            </div>
            <div className="flex w-full flex-col gap-1 sm:w-48 lg:w-52">
              <label htmlFor="promo-type" className="text-xs font-medium text-muted-foreground">
                Type
              </label>
              <select
                id="promo-type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">Tous les types</option>
                <option value="HOT_DEAL">Hot Deal</option>
                <option value="WEEKLY">Hebdomadaire</option>
                <option value="PRODUCT">Produit</option>
                <option value="CATEGORY">Catégorie</option>
              </select>
            </div>
            <div className="flex w-full flex-col gap-1 sm:w-52 lg:w-56">
              <label htmlFor="promo-schedule" className="text-xs font-medium text-muted-foreground">
                Calendrier
              </label>
              <select
                id="promo-schedule"
                value={scheduleFilter}
                onChange={(e) =>
                  setScheduleFilter(e.target.value as typeof scheduleFilter)
                }
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">Tous les états</option>
                <option value="live">En cours</option>
                <option value="upcoming">À venir</option>
                <option value="inactive">Inactive / terminée</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement des promotions…</p>
            </div>
          ) : promotions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-b-xl border-t border-dashed border-border bg-muted/15 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Tag className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Aucune promotion</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Créez une promotion pour afficher des remises sur la boutique.
              </p>
              <Button asChild className="mt-6">
                <Link href="/admin/promotions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle promotion
                </Link>
              </Button>
            </div>
          ) : filteredPromotions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-b-xl border-t border-dashed border-border bg-muted/15 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Aucun résultat</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Modifiez la recherche ou les filtres type / calendrier.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Promotion
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Remise
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Période
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Portée
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      État
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromotions.map((promotion) => {
                    const status = scheduleStatus(promotion)
                    const prodCount = promotion.products?.length ?? 0
                    const catCount = promotion.categories?.length ?? 0
                    return (
                      <tr
                        key={promotion.id}
                        className="border-b border-border/80 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-4 align-top sm:px-6">
                          <div className="font-semibold text-foreground">{promotion.name}</div>
                          <span
                            className={cn(
                              "mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              typeBadgeClass(promotion.type)
                            )}
                          >
                            {getPromotionTypeLabel(promotion.type)}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top sm:px-6">
                          <div className="text-lg font-bold text-primary">
                            −{formatDiscount(promotion.discountType, promotion.discountValue)}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top sm:px-6">
                          <div className="flex items-start gap-2 text-sm text-foreground">
                            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <div>
                              <div>
                                {new Date(promotion.startDate).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="text-muted-foreground">
                                →{" "}
                                {new Date(promotion.endDate).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top sm:px-6">
                          <div className="flex flex-col gap-1 text-sm text-foreground">
                            <span className="flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-muted-foreground" />
                              {prodCount} produit{prodCount !== 1 ? "s" : ""}
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Layers className="h-3.5 w-3.5" />
                              {catCount} catégorie{catCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top sm:px-6">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              scheduleBadgeClass(status)
                            )}
                          >
                            {scheduleLabel(status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right align-top sm:px-6">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="shadow-sm" asChild>
                              <Link href={`/admin/promotions/${promotion.id}/edit`}>
                                <Edit className="mr-1.5 h-3.5 w-3.5" />
                                Modifier
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => {
                                setPendingDeleteId(promotion.id)
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
        title="Supprimer cette promotion ?"
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
