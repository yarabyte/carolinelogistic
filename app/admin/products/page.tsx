"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Plus, Edit, Trash2, Search, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"

interface Product {
  id: string
  title: string
  price: number
  stock: number
  isPartner: boolean
  isFeatured: boolean
  category: { name: string } | null
  partner: { name: string } | null
}

interface CategoryOption {
  id: string
  name: string
  parent: { name: string } | null
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [categoryId, setCategoryId] = useState("")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Inverser l'ordre si on clique sur la même colonne
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Nouvelle colonne, commencer par desc
      setSortBy(column)
      setSortOrder("desc")
    }
    setPage(1) // Réinitialiser à la première page lors du tri
  }

  const SortHeader = ({ column, children }: { column: string; children: React.ReactNode }) => {
    const isActive = sortBy === column
    return (
      <th 
        className="text-left p-4 text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 select-none transition-colors"
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-2">
          {children}
          {isActive ? (
            sortOrder === "asc" ? (
              <ArrowUp className="w-4 h-4 text-primary" />
            ) : (
              <ArrowDown className="w-4 h-4 text-primary" />
            )
          ) : (
            <ArrowUpDown className="w-4 h-4 text-muted-foreground opacity-50" />
          )}
        </div>
      </th>
    )
  }

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy: sortBy,
        sortOrder: sortOrder,
      })
      if (search) params.append("search", search)
      if (categoryId) params.append("categoryId", categoryId)
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      setProducts(data.products || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryId, sortBy, sortOrder])

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data: CategoryOption[]) => {
        if (Array.isArray(data)) setCategories(data)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    setPage(1)
  }, [search, categoryId])

  const doDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (res.ok) fetchProducts()
      else {
        const error = await res.json()
        alert(error.error || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Erreur lors de la suppression")
    } finally {
      setConfirmOpen(false)
      setPendingDeleteId(null)
    }
  }

  const handleConfirmDelete = () => {
    if (pendingDeleteId) doDelete(pendingDeleteId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produits</h1>
          <p className="text-muted-foreground mt-2">
            Gestion des produits internes et partenaires
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau produit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-64 shrink-0">
              <label htmlFor="category-filter" className="sr-only">
                Catégorie
              </label>
              <select
                id="category-filter"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Toutes les catégories</option>
                {[...categories]
                  .sort((a, b) => a.name.localeCompare(b.name, "fr"))
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parent ? `${cat.parent.name} › ${cat.name}` : cat.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun produit trouvé.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <SortHeader column="title">Produit</SortHeader>
                    <SortHeader column="categoryId">Catégorie</SortHeader>
                    <SortHeader column="price">Prix</SortHeader>
                    <SortHeader column="stock">Stock</SortHeader>
                    <SortHeader column="isPartner">Type</SortHeader>
                    <th className="text-left p-4 text-sm font-medium text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium text-foreground">{product.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {product.isFeatured && (
                            <span className="text-xs text-primary">⭐ En vedette</span>
                          )}
                          {product.isPartner && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              🔗 Partenaire
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {product.category?.name || "-"}
                      </td>
                      <td className="p-4 text-sm font-medium text-foreground">
                        {product.price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </td>
                      <td className="p-4 text-sm text-foreground">{product.stock}</td>
                      <td className="p-4">
                        {product.isPartner ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <ExternalLink className="w-3 h-3" />
                            Partenaire
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Interne
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPendingDeleteId(product.id)
                              setConfirmOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer ce produit ?"
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
