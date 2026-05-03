"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Layers,
  Package,
  FolderTree,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  image: string | null
  description: string | null
  parent: Category | null
  children: Category[]
  _count: {
    products: number
  }
}

function countProductsRecursive(cat: Category): number {
  let n = cat._count?.products ?? 0
  for (const c of cat.children || []) {
    n += countProductsRecursive(c)
  }
  return n
}

/** Aperçu texte (sans balises HTML éventuelles) */
function descriptionPreview(raw: string | null, maxLen = 220): string {
  if (!raw?.trim()) return ""
  const text = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen).trim()}…`
}

function CategoryTreeItem({
  category,
  depth,
  onRequestDelete,
}: {
  category: Category
  depth: number
  onRequestDelete: (cat: Category) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = category.children && Array.isArray(category.children) && category.children.length > 0
  const descPreview = descriptionPreview(category.description)
  const descTitle = descriptionPreview(category.description, 2000)

  return (
    <div className={cn("relative", depth > 0 && "mt-2 pl-4 sm:pl-6")}>
      {depth > 0 && (
        <span
          className="absolute left-0 top-0 bottom-0 w-px bg-border sm:left-2"
          aria-hidden
        />
      )}
      <div
        className={cn(
          "group flex flex-col gap-3 rounded-xl border border-border bg-card/80 p-3 shadow-sm transition-all",
          "sm:flex-row sm:items-center sm:justify-between sm:gap-4",
          "hover:border-primary/25 hover:bg-card hover:shadow-md"
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Replier" : "Déplier"}
            >
              <ChevronRight
                className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-90")}
              />
            </button>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            </div>
          )}

          {category.image ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              <Image
                src={category.image}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-foreground">{category.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <Package className="h-3 w-3" />
                {category._count?.products ?? 0} produit(s)
              </span>
              <code className="rounded bg-muted/80 px-2 py-0.5 text-xs text-muted-foreground">
                {category.slug}
              </code>
            </div>
            {descPreview ? (
              <p
                className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground"
                title={descTitle}
              >
                {descPreview}
              </p>
            ) : (
              <p className="mt-2 text-xs italic text-muted-foreground/70">Aucune description</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1 border-t border-border/60 pt-3 sm:border-0 sm:pt-0 sm:opacity-90 sm:transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <Button variant="outline" size="sm" className="h-9" asChild>
            <Link href={`/admin/categories/${category.id}/edit`}>
              <Edit className="mr-1.5 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onRequestDelete(category)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2 border-l-2 border-primary/15 pl-3 sm:pl-4">
          {(category.children || []).map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              depth={depth + 1}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()

      const normalizeCategory = (cat: Category): Category => ({
        ...cat,
        children: Array.isArray(cat.children) ? cat.children.map(normalizeCategory) : [],
        _count: cat._count || { products: 0 },
      })

      const normalizedData = Array.isArray(data) ? data.map(normalizeCategory) : []
      const rootCategories = normalizedData.filter((cat: Category) => !cat.parentId)
      setCategories(rootCategories)
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const totalProductsInTree = categories.reduce((sum, c) => sum + countProductsRecursive(c), 0)

  const doDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
      if (res.ok) fetchCategories()
      else {
        const error = await res.json()
        alert(error.error || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      alert("Erreur lors de la suppression")
    } finally {
      setConfirmOpen(false)
      setPendingDelete(null)
    }
  }

  const handleConfirmDelete = () => {
    if (pendingDelete) doDelete(pendingDelete.id)
  }

  const handleRequestDelete = (cat: Category) => {
    setPendingDelete({ id: cat.id, name: cat.name })
    setConfirmOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <Card className="overflow-hidden border-2 border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement des catégories…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <FolderTree className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Catégories
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                Organisez votre catalogue : catégories racines, sous-catégories et liens produits.
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="shrink-0 shadow-sm">
            <Link href="/admin/categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle catégorie
            </Link>
          </Button>
        </div>

        <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/80 bg-background/60 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Racines
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{categories.length}</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/60 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Produits (arborescence)
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{totalProductsInTree}</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/60 px-4 py-3 backdrop-blur-sm sm:col-span-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Astuce
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Dépliez une catégorie pour voir ses sous-catégories.
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-2 border-border shadow-md">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Arborescence</CardTitle>
          </div>
          <CardDescription>
            {categories.length === 0
              ? "Aucune catégorie racine pour le moment."
              : `${categories.length} catégorie(s) racine — cliquez sur la flèche pour afficher les enfants.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <FolderTree className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Aucune catégorie</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Créez une première catégorie pour structurer votre boutique et rattacher vos
                produits.
              </p>
              <Button asChild className="mt-6">
                <Link href="/admin/categories/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une catégorie
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <CategoryTreeItem
                  key={category.id}
                  category={category}
                  depth={0}
                  onRequestDelete={handleRequestDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer la catégorie"
        message={
          pendingDelete
            ? `Supprimer la catégorie « ${pendingDelete.name} » ? Cette action est irréversible.`
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
