"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  Mail,
  Search,
  Download,
  Trash2,
  Loader2,
  Users,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Inbox,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Subscriber {
  id: string
  email: string
  consent: boolean
  createdAt: string
}

interface NewsletterStats {
  total: number
  withConsent: number
  newSubscribers: number
}

interface NewsletterData {
  subscribers: Subscriber[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: NewsletterStats
}

function consentBadgeClass(consent: boolean) {
  return consent
    ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800/50"
    : "bg-muted text-muted-foreground ring-1 ring-border"
}

export default function NewsletterPage() {
  const [data, setData] = useState<NewsletterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; email: string } | null>(null)
  const { toast } = useToast()

  const fetchSubscribers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...(search.trim() && { search: search.trim() }),
      })

      const response = await fetch(`/api/newsletter?${params}`)
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des abonnés")
      }

      const result = (await response.json()) as NewsletterData
      setData(result)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Impossible de charger les abonnés"
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSubscribers()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- search debounced in separate effect
  }, [page])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 1) {
        void fetchSubscribers()
      } else {
        setPage(1)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced search; fetch uses latest state
  }, [search])

  const doDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/newsletter/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Erreur lors de la suppression")
      toast({ variant: "success", title: "Succès", description: "Abonné supprimé avec succès" })
      void fetchSubscribers()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Impossible de supprimer l'abonné"
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
      setConfirmOpen(false)
      setPendingDelete(null)
    }
  }

  const handleConfirmDelete = () => {
    if (pendingDelete) void doDelete(pendingDelete.id)
  }

  const handleExport = async () => {
    try {
      const response = await fetch("/api/newsletter/export")
      if (!response.ok) {
        throw new Error("Erreur lors de l'export")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        variant: "success",
        title: "Export réussi",
        description: "Le fichier CSV a été téléchargé",
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Impossible d'exporter les données"
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      })
    }
  }

  const stats = data?.stats
  const consentPct =
    stats && stats.total > 0 ? Math.round((stats.withConsent / stats.total) * 100) : 0
  const showKpiSkeleton = loading && !data

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Mail className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Newsletter
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                Abonnés, consentement RGPD et export CSV pour vos campagnes e-mail.
              </p>
            </div>
          </div>
          <Button
            onClick={() => void handleExport()}
            size="lg"
            variant="outline"
            className="shrink-0 border-primary/30 bg-background/80 shadow-sm hover:bg-primary/5"
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {showKpiSkeleton ? (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[88px] animate-pulse rounded-xl border border-border/60 bg-muted/40"
                />
              ))}
            </>
          ) : (
            stats && (
              <>
                <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total abonnés
                  </p>
                  <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                    <Users className="h-5 w-5 shrink-0 text-primary" />
                    {stats.total.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-xs text-muted-foreground">tous les inscrits</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Avec consentement
                  </p>
                  <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    {stats.withConsent.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-xs text-muted-foreground">{consentPct}% du total</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Nouveaux (30 j)
                  </p>
                  <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
                    <TrendingUp className="h-5 w-5 shrink-0 text-primary" />
                    {stats.newSubscribers.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-xs text-muted-foreground">sur les 30 derniers jours</p>
                </div>
              </>
            )
          )}
        </div>
      </div>

      <Card className="overflow-hidden border-2 border-border shadow-md">
        <CardHeader className="space-y-4 border-b border-border bg-muted/30 pb-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Inbox className="h-5 w-5 text-primary" />
              Abonnés
            </CardTitle>
            <CardDescription className="mt-1">
              Recherche par e-mail (serveur), 50 lignes par page.
            </CardDescription>
          </div>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par e-mail…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 border-border/80 bg-background pl-10 shadow-inner"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && !data ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement des abonnés…</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center gap-3 border-t border-border py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Actualisation…</p>
            </div>
          ) : null}

          {!loading && data && data.subscribers.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                        E-mail
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                        Consentement
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                        Inscription
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.subscribers.map((subscriber) => (
                      <tr
                        key={subscriber.id}
                        className="border-b border-border/80 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-4 align-top sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/80">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="break-all font-medium text-foreground">
                              {subscriber.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top sm:px-6">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              consentBadgeClass(subscriber.consent)
                            )}
                          >
                            {subscriber.consent ? "Oui" : "Non"}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top sm:px-6">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                            {format(new Date(subscriber.createdAt), "dd/MM/yyyy HH:mm")}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right align-top sm:px-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              setPendingDelete({ id: subscriber.id, email: subscriber.email })
                              setConfirmOpen(true)
                            }}
                            disabled={deletingId === subscriber.id}
                          >
                            {deletingId === subscriber.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="sr-only">Supprimer</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.pagination.totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-sm text-muted-foreground">
                    {(data.pagination.page - 1) * data.pagination.limit + 1} –{" "}
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}{" "}
                    sur {data.pagination.total.toLocaleString("fr-FR")} abonné
                    {data.pagination.total > 1 ? "s" : ""}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="shadow-sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={data.pagination.page === 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shadow-sm"
                      onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={data.pagination.page === data.pagination.totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && data && data.subscribers.length === 0 && (
            <div className="flex flex-col items-center justify-center border-t border-dashed border-border bg-muted/15 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">
                {search.trim() ? "Aucun résultat" : "Aucun abonné"}
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {search.trim()
                  ? "Aucun e-mail ne correspond à cette recherche."
                  : "Les inscriptions depuis le site apparaîtront ici."}
              </p>
            </div>
          )}

          {!loading && !data && (
            <div className="flex flex-col items-center justify-center gap-4 border-t border-dashed border-border bg-muted/15 px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Impossible de charger la liste. Vérifiez votre session ou réessayez.
              </p>
              <Button variant="outline" size="sm" onClick={() => void fetchSubscribers()}>
                Réessayer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer l'abonné"
        message={
          pendingDelete
            ? `Supprimer définitivement ${pendingDelete.email} de la liste ?`
            : ""
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
