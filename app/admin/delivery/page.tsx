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
  Truck,
  Loader2,
  Search,
  MapPinned,
  Euro,
  ArrowUpDown,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DeliveryZone {
  id: string
  name: string
  price: number
  isActive: boolean
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
}

function statusBadgeClass(isActive: boolean) {
  return isActive
    ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800/50"
    : "bg-red-100 text-red-900 ring-1 ring-red-200/80 dark:bg-red-950/50 dark:text-red-100 dark:ring-red-800/50"
}

export default function DeliveryPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const fetchZones = async () => {
    try {
      const res = await fetch("/api/delivery/zones")
      const data = await res.json()
      setZones(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching delivery zones:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchZones()
  }, [])

  const filteredZones = useMemo(() => {
    const q = search.trim().toLowerCase()
    return zones.filter((z) => {
      if (statusFilter === "active" && !z.isActive) return false
      if (statusFilter === "inactive" && z.isActive) return false
      if (!q) return true
      return z.name.toLowerCase().includes(q)
    })
  }, [zones, search, statusFilter])

  const stats = useMemo(() => {
    const active = zones.filter((z) => z.isActive)
    const prices = active.map((z) => z.price)
    const minP = prices.length ? Math.min(...prices) : 0
    const maxP = prices.length ? Math.max(...prices) : 0
    const avg =
      active.length > 0 ? active.reduce((s, z) => s + z.price, 0) / active.length : 0
    return {
      total: zones.length,
      activeCount: active.length,
      inactiveCount: zones.length - active.length,
      avgActive: avg,
      minActive: minP,
      maxActive: maxP,
      hasActivePrices: prices.length > 0,
    }
  }, [zones])

  const doDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/delivery/zones/${id}`, { method: "DELETE" })
      if (res.ok) void fetchZones()
      else {
        const error = (await res.json()) as { error?: string }
        alert(error.error || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Error deleting delivery zone:", error)
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
              <Truck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Zones de livraison
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                Tarifs par zone au checkout. Seules les zones actives sont proposées aux clients.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="shrink-0 border-primary/30 bg-background/80 shadow-sm hover:bg-primary/5"
          >
            <Link href="/admin/delivery/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle zone
            </Link>
          </Button>
        </div>

        {!loading && zones.length > 0 && (
          <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Zones
              </p>
              <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                <MapPinned className="h-5 w-5 text-primary" />
                {stats.total}
              </p>
              <p className="text-xs text-muted-foreground">enregistrées</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actives
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stats.activeCount}</p>
              <p className="text-xs text-muted-foreground">
                {stats.inactiveCount > 0
                  ? `${stats.inactiveCount} inactive(s)`
                  : "toutes disponibles au checkout"}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tarif moyen (actives)
              </p>
              <p className="mt-1 flex items-baseline gap-1 text-2xl font-bold text-foreground">
                <Euro className="h-5 w-5 shrink-0 text-primary" />
                {stats.hasActivePrices ? formatPrice(stats.avgActive) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">sur zones actives uniquement</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Fourchette (actives)
              </p>
              <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                <ArrowUpDown className="h-5 w-5 shrink-0 text-primary" />
                {stats.hasActivePrices
                  ? `${formatPrice(stats.minActive)} – ${formatPrice(stats.maxActive)}`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">min → max</p>
            </div>
          </div>
        )}
      </div>

      <Card className="overflow-hidden border-2 border-border shadow-md">
        <CardHeader className="space-y-4 border-b border-border bg-muted/30 pb-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPinned className="h-5 w-5 text-primary" />
              Liste des zones
            </CardTitle>
            <CardDescription className="mt-1">
              Recherche par nom, filtre actif / inactif (côté client).
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nom de la zone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 border-border/80 bg-background pl-10 shadow-inner"
              />
            </div>
            <div className="flex w-full flex-col gap-1 sm:w-56 lg:w-64">
              <label htmlFor="zone-status" className="text-xs font-medium text-muted-foreground">
                Statut
              </label>
              <select
                id="zone-status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "active" | "inactive")
                }
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">Toutes</option>
                <option value="active">Actives uniquement</option>
                <option value="inactive">Inactives uniquement</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement des zones…</p>
            </div>
          ) : zones.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-b-xl border-t border-dashed border-border bg-muted/15 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Aucune zone</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Définissez au moins une zone avec un tarif pour activer les frais de port au
                checkout.
              </p>
              <Button asChild className="mt-6">
                <Link href="/admin/delivery/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle zone
                </Link>
              </Button>
            </div>
          ) : filteredZones.length === 0 ? (
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
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Zone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                      Frais
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
                  {filteredZones.map((zone) => (
                    <tr
                      key={zone.id}
                      className="border-b border-border/80 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-4 align-top sm:px-6">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/80">
                            <MapPinned className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground">{zone.name}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              Frais fixes pour cette zone
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top sm:px-6">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Euro className="h-4 w-4 shrink-0 text-muted-foreground" />
                          {formatPrice(zone.price)}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top sm:px-6">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            statusBadgeClass(zone.isActive)
                          )}
                        >
                          {zone.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right align-top sm:px-6">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button variant="outline" size="sm" className="shadow-sm" asChild>
                            <Link href={`/admin/delivery/${zone.id}/edit`}>
                              <Edit className="mr-1.5 h-3.5 w-3.5" />
                              Modifier
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              setPendingDeleteId(zone.id)
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
        title="Supprimer cette zone de livraison ?"
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
