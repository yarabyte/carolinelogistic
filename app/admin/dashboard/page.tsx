import { prisma } from "@/lib/db/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  FolderTree,
  Handshake,
  Mail,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Percent,
  LayoutList,
} from "lucide-react"
import Link from "next/link"

const LOW_STOCK_THRESHOLD = 5

async function getDashboardStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    ordersTotal,
    ordersPending,
    ordersThisMonth,
    ordersByStatus,
    productsActive,
    productsLowStock,
    usersCount,
    categoriesCount,
    partnersCount,
    newsletterCount,
    promotionsActive,
    revenueAll,
    revenueThisMonth,
    revenueLastMonth,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
      select: { id: true, title: true, stock: true },
      orderBy: { stock: "asc" },
      take: 10,
    }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.category.count(),
    prisma.partner.count({ where: { isActive: true } }),
    prisma.newsletter.count(),
    prisma.promotion.count({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    }),
    prisma.order.aggregate({
      where: { status: { in: ["CONFIRMED", "SHIPPING", "DELIVERED"] } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: ["CONFIRMED", "SHIPPING", "DELIVERED"] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: ["CONFIRMED", "SHIPPING", "DELIVERED"] },
        createdAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
      },
    }),
  ])

  const revenue = revenueAll._sum.total ?? 0
  const revenueMonth = revenueThisMonth._sum.total ?? 0
  const revenuePrevMonth = revenueLastMonth._sum.total ?? 0
  const revenueTrend =
    revenuePrevMonth > 0
      ? ((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 100
      : revenueMonth > 0
        ? 100
        : 0

  const statusCounts = Object.fromEntries(
    ordersByStatus.map((s) => [s.status, s._count.id])
  )

  return {
    ordersTotal,
    ordersPending,
    ordersThisMonth,
    statusCounts,
    productsActive,
    productsLowStock,
    usersCount,
    categoriesCount,
    partnersCount,
    newsletterCount,
    promotionsActive,
    revenue,
    revenueMonth,
    revenueTrend,
    recentOrders,
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price)
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmée",
    SHIPPING: "En livraison",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
  }
  return labels[status] ?? status
}

function getStatusBadgeClass(status: string) {
  const classes: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
    CONFIRMED: "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200",
    SHIPPING: "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-200",
    DELIVERED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
    CANCELLED: "bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200",
  }
  return classes[status] ?? "bg-muted text-muted-foreground"
}

const STATUS_ORDER = ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"] as const

export default async function DashboardPage() {
  const s = await getDashboardStats()

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const mainCards = [
    {
      title: "Commandes",
      value: s.ordersTotal.toLocaleString("fr-FR"),
      hint: `${s.ordersThisMonth} ce mois-ci`,
      icon: ShoppingCart,
      accent: "from-blue-500/15 to-blue-500/5",
      iconBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
      trend: null as "up" | "down" | null,
    },
    {
      title: "Produits actifs",
      value: s.productsActive.toLocaleString("fr-FR"),
      hint:
        s.productsLowStock.length > 0
          ? `${s.productsLowStock.length} en stock bas`
          : "Stock sous contrôle",
      icon: Package,
      accent: "from-emerald-500/15 to-emerald-500/5",
      iconBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      trend: null as "up" | "down" | null,
    },
    {
      title: "Équipe",
      value: s.usersCount.toLocaleString("fr-FR"),
      hint: "Comptes actifs",
      icon: Users,
      accent: "from-violet-500/15 to-violet-500/5",
      iconBg: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
      trend: null as "up" | "down" | null,
    },
    {
      title: "Chiffre d’affaires",
      value: s.revenue >= 1000 ? `${(s.revenue / 1000).toFixed(1)} k€` : formatPrice(s.revenue),
      hint:
        s.revenueTrend !== 0
          ? `${s.revenueTrend >= 0 ? "+" : ""}${s.revenueTrend.toFixed(1)} % vs mois dernier`
          : "Commandes confirmées / livrées",
      icon: TrendingUp,
      accent: "from-primary/20 to-primary/5",
      iconBg: "bg-primary/15 text-primary",
      trend: (s.revenueTrend >= 0 ? "up" : "down") as "up" | "down",
    },
  ]

  const secondaryCards = [
    {
      title: "À traiter",
      value: s.ordersPending,
      sub: "commandes en attente",
      icon: Clock,
      href: "/admin/orders",
    },
    {
      title: "Catégories",
      value: s.categoriesCount,
      sub: "rubriques",
      icon: FolderTree,
      href: "/admin/categories",
    },
    {
      title: "Partenaires",
      value: s.partnersCount,
      sub: "actifs",
      icon: Handshake,
      href: "/admin/partners",
    },
    {
      title: "Newsletter",
      value: s.newsletterCount,
      sub: "inscrits",
      icon: Mail,
      href: "/admin/newsletter",
    },
  ]

  const statusMax = Math.max(
    1,
    ...STATUS_ORDER.map((st) => s.statusCounts[st] ?? 0)
  )

  return (
    <div className="space-y-8 pb-8">
      {/* En-tête */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/[0.07] blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Administration
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Tableau de bord
            </h1>
            <p className="max-w-lg text-sm text-muted-foreground md:text-base">
              Synthèse de l’activité boutique : commandes, stocks, audience et revenus.
            </p>
            <p className="text-xs capitalize text-muted-foreground/90 md:text-sm">{dateLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-xl shadow-sm">
              <Link href="/admin/orders">
                <LayoutList className="mr-2 h-4 w-4" />
                Commandes
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-xl border-border bg-background/80">
              <Link href="/admin/products">
                <Package className="mr-2 h-4 w-4" />
                Produits
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-xl border-border bg-background/80">
              <Link href="/admin/analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* KPI principaux */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {mainCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.title}
              className="group relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 hover:border-primary/20 hover:shadow-md dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100 ${card.accent}`}
                aria-hidden
              />
              <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg} transition-transform duration-200 group-hover:scale-105`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative space-y-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground md:text-3xl">
                    {card.value}
                  </p>
                  {card.trend === "up" && (
                    <TrendingUp
                      className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden
                    />
                  )}
                  {card.trend === "down" && (
                    <TrendingDown
                      className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                      aria-hidden
                    />
                  )}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Métriques secondaires — liens rapides */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {secondaryCards.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-muted/30 p-4 shadow-sm transition-all duration-200 hover:border-primary/25 hover:bg-muted/50 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm ring-1 ring-border/60 transition-transform duration-200 group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{item.title}</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{item.value}</p>
                <p className="truncate text-[11px] text-muted-foreground">{item.sub}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Dernières commandes */}
        <Card className="overflow-hidden rounded-2xl border-border/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] lg:col-span-3 dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border/60 bg-muted/20 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Dernières commandes</CardTitle>
              <CardDescription>Les 8 plus récentes</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0 rounded-xl text-primary">
              <Link href="/admin/orders" className="gap-1">
                Tout voir
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">N°</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="hidden px-4 py-3 text-right sm:table-cell">Date</th>
                    <th className="w-12 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {s.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        Aucune commande pour le moment.
                      </td>
                    </tr>
                  ) : (
                    s.recentOrders.map((order, i) => (
                      <tr
                        key={order.id}
                        className={`border-b border-border/60 transition-colors duration-200 last:border-0 hover:bg-muted/40 ${
                          i % 2 === 1 ? "bg-muted/10" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">{order.orderNumber}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(order.status)}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                          {formatPrice(order.total)}
                        </td>
                        <td className="hidden px-4 py-3 text-right text-muted-foreground sm:table-cell">
                          {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-2 py-3 text-right">
                          <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg text-xs">
                            <Link href={`/admin/orders/${order.id}`}>Voir</Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Répartition + encarts */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="rounded-2xl border-border/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <CardTitle className="text-lg font-semibold">Commandes par statut</CardTitle>
              <CardDescription>Volume relatif</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {STATUS_ORDER.map((status) => {
                const count = s.statusCounts[status] ?? 0
                const pct = Math.round((count / statusMax) * 100)
                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 font-medium ${getStatusBadgeClass(status)}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                      <span className="tabular-nums font-semibold text-foreground">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/80 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {s.promotionsActive > 0 && (
              <Card className="rounded-2xl border-primary/15 bg-gradient-to-br from-primary/[0.06] to-transparent shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <CardTitle className="text-base">Promotions</CardTitle>
                  </div>
                  <CardDescription>{s.promotionsActive} campagne(s) en cours</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="secondary" size="sm" className="w-full rounded-xl">
                    <Link href="/admin/promotions" className="gap-1">
                      <Percent className="h-4 w-4" />
                      Gérer les promotions
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            {s.newsletterCount > 0 && (
              <Card className="rounded-2xl border-border/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Newsletter</CardTitle>
                  <CardDescription>Audience e-mail</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                    {s.newsletterCount.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-xs text-muted-foreground">Inscrits — export depuis la section dédiée</p>
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full rounded-xl">
                    <Link href="/admin/newsletter">Ouvrir la newsletter</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Stock bas */}
      {s.productsLowStock.length > 0 && (
        <Card className="overflow-hidden rounded-2xl border-amber-500/25 bg-gradient-to-br from-amber-500/[0.06] to-card shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:from-amber-500/10 dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-amber-500/15 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Produits en stock bas</CardTitle>
                <CardDescription>Stock ≤ {LOW_STOCK_THRESHOLD} unités — à réapprovisionner</CardDescription>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-xl border-amber-500/30 bg-card">
              <Link href="/admin/products" className="gap-1">
                Catalogue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Produit</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="w-24 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {s.productsLowStock.map((product, i) => (
                    <tr
                      key={product.id}
                      className={`border-b border-border/60 last:border-0 hover:bg-muted/30 ${
                        i % 2 === 1 ? "bg-muted/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{product.title}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            product.stock === 0
                              ? "font-semibold text-red-600 dark:text-red-400"
                              : "font-semibold text-amber-700 dark:text-amber-400"
                          }
                        >
                          {product.stock} u.
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg text-xs">
                          <Link href={`/admin/products/${product.id}/edit`}>Modifier</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
