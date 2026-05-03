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
  Handshake,
  Loader2,
  Package,
  Percent,
  Search,
  UsersRound,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Partner {
  id: string
  name: string
  logo: string | null
  contact: string | null
  commissionRate: number
  isActive: boolean
  _count: {
    products: number
  }
}

function statusBadgeClass(isActive: boolean) {
  return isActive
    ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800/50"
    : "bg-red-100 text-red-900 ring-1 ring-red-200/80 dark:bg-red-950/50 dark:text-red-100 dark:ring-red-800/50"
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const fetchPartners = async () => {
    try {
      const res = await fetch("/api/partners")
      const data = await res.json()
      setPartners(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching partners:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartners()
  }, [])

  const filteredPartners = useMemo(() => {
    const q = search.trim().toLowerCase()
    return partners.filter((p) => {
      if (statusFilter === "active" && !p.isActive) return false
      if (statusFilter === "inactive" && p.isActive) return false
      if (!q) return true
      const name = p.name.toLowerCase()
      const contact = (p.contact || "").toLowerCase()
      return name.includes(q) || contact.includes(q)
    })
  }, [partners, search, statusFilter])

  const stats = useMemo(() => {
    const active = partners.filter((p) => p.isActive).length
    const products = partners.reduce((sum, p) => sum + (p._count?.products ?? 0), 0)
    return {
      total: partners.length,
      active,
      inactive: partners.length - active,
      products,
    }
  }, [partners])

  const doDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/partners/${id}`, { method: "DELETE" })
      if (res.ok) fetchPartners()
      else {
        const error = await res.json()
        alert(error.error || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Error deleting partner:", error)
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
              <Handshake className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Partenaires
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                Gérez les partenaires, commissions et produits associés au catalogue.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="shrink-0 border-primary/30 bg-background/80 shadow-sm hover:bg-primary/5"
          >
            <Link href="/admin/partners/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau partenaire
            </Link>
          </Button>
        </div>

        {!loading && partners.length > 0 && (
          <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Partenaires
              </p>
              <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                <UsersRound className="h-5 w-5 text-primary" />
                {stats.total}
              </p>
              <p className="text-xs text-muted-foreground">enregistrés</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actifs
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stats.active}</p>
              <p className="text-xs text-muted-foreground">
                {stats.inactive > 0 ? `${stats.inactive} inactif(s)` : "tous visibles boutique"}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm sm:col-span-2 lg:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Produits liés
              </p>
              <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                <Package className="h-5 w-5 text-primary" />
                {stats.products}
              </p>
              <p className="text-xs text-muted-foreground">total sur tous les partenaires</p>
            </div>
          </div>
        )}
      </div>

      <Card className="overflow-hidden border-2 border-border shadow-md">
        <CardHeader className="space-y-4 border-b border-border bg-muted/30 pb-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <UsersRound className="h-5 w-5 text-primary" />
                Liste des partenaires
              </CardTitle>
              <CardDescription className="mt-1">
                Recherche par nom ou contact. Filtre actif / inactif côté client.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nom ou contact…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 border-border/80 bg-background pl-10 shadow-inner"
              />
            </div>
            <div className="flex w-full flex-col gap-1 sm:w-56 lg:w-64">
              <label htmlFor="partner-status" className="text-xs font-medium text-muted-foreground">
                Visibilité
              </label>
              <select
                id="partner-status"
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
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement des partenaires…</p>
            </div>
          ) : partners.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-b-xl border-t border-dashed border-border bg-muted/15 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Handshake className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Aucun partenaire</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Créez un partenaire pour lier des produits et suivre les commissions.
              </p>
              <Button asChild className="mt-6">
                <Link href="/admin/partners/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau partenaire
                </Link>
              </Button>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-b-xl border-t border-dashed border-border bg-muted/15 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Aucun résultat</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Ajustez la recherche ou le filtre de visibilité.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Partenaire
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Commission
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Produits
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
                  {filteredPartners.map((partner) => (
                    <tr
                      key={partner.id}
                      className="border-b border-border/80 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-4 align-top sm:px-6">
                        <div className="flex items-start gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                            {partner.logo ? (
                              <img
                                src={partner.logo}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                                {partner.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground">{partner.name}</div>
                            {partner.contact && (
                              <div className="mt-0.5 truncate text-sm text-muted-foreground">
                                {partner.contact}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top sm:px-6">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Percent className="h-4 w-4 shrink-0 text-muted-foreground" />
                          {partner.commissionRate}%
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top sm:px-6">
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                          {partner._count.products}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top sm:px-6">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            statusBadgeClass(partner.isActive)
                          )}
                        >
                          {partner.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right align-top sm:px-6">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button variant="outline" size="sm" className="shadow-sm" asChild>
                            <Link href={`/admin/partners/${partner.id}/edit`}>
                              <Edit className="mr-1.5 h-3.5 w-3.5" />
                              Modifier
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              setPendingDeleteId(partner.id)
                              setConfirmOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Supprimer</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer ce partenaire ?"
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
