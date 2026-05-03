"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Eye,
  Download,
  Search,
  ClipboardList,
  Loader2,
  Package,
  Euro,
  Calendar,
  Truck,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  shippingCost: number
  customerInfo: { name?: string; email?: string } | null
  createdAt: string
  items: { id?: string }[]
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
}

function getStatusBadgeColor(status: string) {
  const colors: Record<string, string> = {
    PENDING:
      "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-800/50",
    CONFIRMED:
      "bg-sky-100 text-sky-900 ring-1 ring-sky-200/80 dark:bg-sky-950/50 dark:text-sky-100 dark:ring-sky-800/50",
    SHIPPING:
      "bg-violet-100 text-violet-900 ring-1 ring-violet-200/80 dark:bg-violet-950/50 dark:text-violet-100 dark:ring-violet-800/50",
    DELIVERED:
      "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800/50",
    CANCELLED:
      "bg-red-100 text-red-900 ring-1 ring-red-200/80 dark:bg-red-950/50 dark:text-red-100 dark:ring-red-800/50",
  }
  return (
    colors[status] ||
    "bg-muted text-muted-foreground ring-1 ring-border"
  )
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmée",
    SHIPPING: "En livraison",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
  }
  return labels[status] || status
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })
      if (statusFilter) params.append("status", statusFilter)

      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter])

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append("status", statusFilter)

      const res = await fetch(`/api/orders/export?${params}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting orders:", error)
      alert("Erreur lors de l'export")
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      (order.customerInfo?.name || "").toLowerCase().includes(searchLower) ||
      (order.customerInfo?.email || "").toLowerCase().includes(searchLower)
    )
  })

  const pageStats = useMemo(() => {
    const list = filteredOrders
    const count = list.length
    const turnover = list.reduce((sum, o) => sum + (o.total || 0), 0)
    const articles = list.reduce((sum, o) => sum + (o.items?.length ?? 0), 0)
    return { count, turnover, articles }
  }, [filteredOrders])

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Commandes
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                Consultez les commandes, filtres par statut et export CSV pour la comptabilité.
              </p>
            </div>
          </div>
          <Button
            onClick={handleExport}
            size="lg"
            variant="outline"
            className="shrink-0 border-primary/30 bg-background/80 shadow-sm hover:bg-primary/5"
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        {!loading && orders.length > 0 && (
          <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sur cette page (filtré)
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{pageStats.count}</p>
              <p className="text-xs text-muted-foreground">commandes affichées</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Montant TTC (aperçu)
              </p>
              <p className="mt-1 flex items-baseline gap-1 text-2xl font-bold text-foreground">
                <Euro className="h-5 w-5 shrink-0 text-primary" />
                {formatPrice(pageStats.turnover)}
              </p>
              <p className="text-xs text-muted-foreground">montants TTC des lignes visibles</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Articles
              </p>
              <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                <Package className="h-5 w-5 text-primary" />
                {pageStats.articles}
              </p>
              <p className="text-xs text-muted-foreground">lignes produit sur la page</p>
            </div>
          </div>
        )}
      </div>

      <Card className="overflow-hidden border-2 border-border shadow-md">
        <CardHeader className="border-b border-border bg-muted/30 space-y-4 pb-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Truck className="h-5 w-5 text-primary" />
                Liste des commandes
              </CardTitle>
              <CardDescription className="mt-1">
                Recherche sur numéro, nom ou email. Le filtre statut interroge le serveur.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Numéro, nom ou email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 border-border/80 bg-background pl-10 shadow-inner"
              />
            </div>
            <div className="flex w-full flex-col gap-1 sm:w-56 lg:w-64">
              <label htmlFor="order-status" className="text-xs font-medium text-muted-foreground">
                Statut
              </label>
              <select
                id="order-status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmée</option>
                <option value="SHIPPING">En livraison</option>
                <option value="DELIVERED">Livrée</option>
                <option value="CANCELLED">Annulée</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement des commandes…</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-b-xl border-t border-dashed border-border bg-muted/15 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Aucune commande</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {search
                  ? "Aucun résultat pour cette recherche sur la page actuelle."
                  : "Les commandes apparaîtront ici dès les premiers achats."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                        Commande
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                        Client
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                        Total TTC
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const itemCount = order.items?.length ?? 0
                      return (
                        <tr
                          key={order.id}
                          className="border-b border-border/80 transition-colors hover:bg-muted/30"
                        >
                          <td className="px-4 py-4 align-top sm:px-6">
                            <div className="font-mono text-sm font-semibold text-foreground">
                              {order.orderNumber}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Package className="h-3 w-3 shrink-0" />
                              {itemCount} article{itemCount > 1 ? "s" : ""}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top sm:px-6">
                            <div className="font-medium text-foreground">
                              {order.customerInfo?.name || "—"}
                            </div>
                            <div className="mt-0.5 truncate text-sm text-muted-foreground">
                              {order.customerInfo?.email || ""}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top sm:px-6">
                            <div className="flex items-center gap-2 text-sm text-foreground">
                              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                              {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="mt-0.5 pl-6 text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top sm:px-6">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                                getStatusBadgeColor(order.status)
                              )}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right align-top sm:px-6">
                            <div className="text-sm font-semibold text-foreground">
                              {formatPrice(order.total || 0)}
                            </div>
                            {order.shippingCost > 0 && (
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                dont livraison {formatPrice(order.shippingCost)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right align-top sm:px-6">
                            <Button variant="outline" size="sm" className="h-9" asChild>
                              <Link href={`/admin/orders/${order.id}`}>
                                <Eye className="mr-1.5 h-4 w-4" />
                                Détail
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 border-t border-border bg-muted/20 px-4 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm font-medium text-muted-foreground">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
