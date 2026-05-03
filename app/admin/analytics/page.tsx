import type { Partner } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Eye,
  MousePointerClick,
  TrendingUp,
  Handshake,
  Trophy,
  Euro,
  Package,
  Percent,
} from "lucide-react"

function formatEur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

type PartnerAggregate = {
  partner: Partner
  views: number
  clicks: number
  products: number
}

type CommissionRow = {
  partner: Partner
  totalSales: number
  commissionRate: number
  commission: number
}

async function getAnalytics() {
  const [partnerProducts, ordersWithItems, partners] = await Promise.all([
    prisma.product.findMany({
      where: { isPartner: true },
      include: { partner: true },
      orderBy: { views: "desc" },
    }),
    prisma.order.findMany({
      where: { status: { not: "CANCELLED" } },
      include: {
        items: { include: { product: { include: { partner: true } } } },
      },
    }),
    prisma.partner.findMany({ where: { isActive: true } }),
  ])

  const totalViews = partnerProducts.reduce((sum, p) => sum + p.views, 0)
  const totalClicks = partnerProducts.reduce((sum, p) => sum + p.clicks, 0)
  const conversionRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0

  const partnerStatsMap = partnerProducts.reduce<Record<string, PartnerAggregate>>(
    (acc, product) => {
      if (!product.partner) return acc
      const partnerId = product.partner.id
      if (!acc[partnerId]) {
        acc[partnerId] = {
          partner: product.partner,
          views: 0,
          clicks: 0,
          products: 0,
        }
      }
      acc[partnerId].views += product.views
      acc[partnerId].clicks += product.clicks
      acc[partnerId].products += 1
      return acc
    },
    {}
  )

  const salesByPartner: Record<string, number> = {}
  for (const order of ordersWithItems) {
    for (const item of order.items) {
      const partnerId = item.product.partnerId
      if (!partnerId) continue
      const amount = item.price * item.quantity
      salesByPartner[partnerId] = (salesByPartner[partnerId] ?? 0) + amount
    }
  }

  const commissionRows: CommissionRow[] = partners.map((partner) => {
    const totalSales = salesByPartner[partner.id] ?? 0
    const rate = partner.commissionRate ?? 0
    const commission = totalSales * (rate / 100)
    return {
      partner,
      totalSales,
      commissionRate: rate,
      commission,
    }
  })

  const partnerStats = Object.values(partnerStatsMap).sort((a, b) => b.views - a.views)

  return {
    totalViews,
    totalClicks,
    conversionRate,
    partnerStats,
    topProducts: partnerProducts.slice(0, 10),
    commissionRows,
    totalPartnerProducts: partnerProducts.length,
  }
}

function EmptyInsight({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export default async function AnalyticsPage() {
  const analytics = await getAnalytics()
  const totalSalesAll = analytics.commissionRows.reduce((s, r) => s + r.totalSales, 0)
  const totalCommissions = analytics.commissionRows.reduce((s, r) => s + r.commission, 0)

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Analytics partenaires
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Vues et clics sur les produits affiliés, performance par partenaire et estimation des
                commissions sur les commandes non annulées.
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total vues
            </p>
            <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
              <Eye className="h-5 w-5 shrink-0 text-primary" />
              {analytics.totalViews.toLocaleString("fr-FR")}
            </p>
            <p className="text-xs text-muted-foreground">
              produits partenaires ({analytics.totalPartnerProducts})
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total clics
            </p>
            <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
              <MousePointerClick className="h-5 w-5 shrink-0 text-primary" />
              {analytics.totalClicks.toLocaleString("fr-FR")}
            </p>
            <p className="text-xs text-muted-foreground">vers liens externes / tracking</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Taux de conversion
            </p>
            <p className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-foreground">
              <TrendingUp className="h-5 w-5 shrink-0 text-primary" />
              {analytics.conversionRate.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">clics ÷ vues (agrégé)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-2 border-border shadow-md">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Handshake className="h-5 w-5 text-primary" />
              Performance par partenaire
            </CardTitle>
            <CardDescription>
              Vues, clics et nombre de produits affiliés par marque.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {analytics.partnerStats.length === 0 ? (
              <EmptyInsight message="Aucun produit partenaire : les statistiques apparaîtront dès qu’il y aura des articles affiliés." />
            ) : (
              <ul className="space-y-2">
                {analytics.partnerStats.map((stat) => (
                  <li
                    key={stat.partner.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{stat.partner.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Package className="h-3.5 w-3.5 shrink-0" />
                        {stat.products} produit{stat.products !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-6 text-right sm:text-right">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Vues
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {stat.views.toLocaleString("fr-FR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Clics
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {stat.clicks.toLocaleString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-border shadow-md">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-5 w-5 text-primary" />
              Top produits
            </CardTitle>
            <CardDescription>Les 10 produits partenaires les plus consultés.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {analytics.topProducts.length === 0 ? (
              <EmptyInsight message="Aucun produit partenaire à afficher pour le moment." />
            ) : (
              <ul className="space-y-2">
                {analytics.topProducts.map((product, index) => (
                  <li
                    key={product.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                          index === 0
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug text-foreground">{product.title}</p>
                        {product.partner && (
                          <p className="mt-0.5 text-sm text-muted-foreground">{product.partner.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-6 pl-11 sm:pl-0">
                      <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Vues
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {product.views.toLocaleString("fr-FR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Clics
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {product.clicks.toLocaleString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-2 border-border shadow-md">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Euro className="h-5 w-5 text-primary" />
            Commissions partenaires
          </CardTitle>
          <CardDescription>
            Estimation à partir du CA des lignes commande (produits avec partenaire), commandes hors
            statut annulé, taux défini sur chaque partenaire actif.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                    Partenaire
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                    <span className="inline-flex items-center justify-end gap-1">
                      <Percent className="h-3.5 w-3.5" />
                      Taux
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                    Ventes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                    Commission
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.commissionRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      Aucun partenaire actif enregistré.
                    </td>
                  </tr>
                ) : (
                  analytics.commissionRows.map((row) => (
                    <tr
                      key={row.partner.id}
                      className="border-b border-border/80 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3.5 font-medium text-foreground sm:px-6">
                        {row.partner.name}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground sm:px-6">
                        {row.commissionRate.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums text-foreground sm:px-6">
                        {formatEur(row.totalSales)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-foreground sm:px-6">
                        {formatEur(row.commission)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {analytics.commissionRows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/50">
                    <td className="px-4 py-3.5 text-sm font-semibold text-foreground sm:px-6">
                      Totaux
                    </td>
                    <td className="px-4 py-3.5 sm:px-6" />
                    <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-foreground sm:px-6">
                      {formatEur(totalSalesAll)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-foreground sm:px-6">
                      {formatEur(totalCommissions)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
