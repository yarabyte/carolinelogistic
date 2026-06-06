"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  children?: Category[]
  _count?: {
    products: number
  }
}

interface CategoriesDropdownProps {
  variant?: "desktop" | "mobile"
  onItemClick?: () => void
}

export function CategoriesDropdown({ variant = "desktop", onItemClick }: CategoriesDropdownProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        const data = await res.json()

        if (!res.ok || !Array.isArray(data)) {
          console.error("Error fetching categories:", data)
          setCategories([])
          return
        }

        // Filter only parent categories (no parentId) and include their children
        const parentCategories = data.filter((cat: Category & { parentId: string | null }) => !cat.parentId)
        const categoriesWithChildren = parentCategories.map((parent: Category & { parentId: string | null }) => ({
          ...parent,
          children: data.filter((cat: Category & { parentId: string | null }) => cat.parentId === parent.id),
        }))
        
        setCategories(categoriesWithChildren)
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleItemClick = () => {
    setIsOpen(false)
    if (onItemClick) {
      onItemClick()
    }
  }

  if (variant === "mobile") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          className="w-full text-left text-sm font-medium text-foreground hover:text-primary py-2 transition-colors flex items-center justify-between"
        >
          <span>Catégories</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && (
          <div className="ml-4 mt-2 space-y-1">
            <Link
              href="/categories"
              className="block text-sm text-muted-foreground hover:text-primary py-1 transition-colors"
              onClick={handleItemClick}
            >
              Toutes les catégories
            </Link>
            {loading ? (
              <div className="text-sm text-muted-foreground py-2">Chargement...</div>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug || category.id}`}
                  className="block text-sm text-muted-foreground hover:text-primary py-1 transition-colors"
                  onClick={handleItemClick}
                >
                  {category.name}
                  {category._count?.products !== undefined && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({category._count.products})
                    </span>
                  )}
                </Link>
              ))
            ) : (
              <div className="text-sm text-muted-foreground py-2">Aucune catégorie</div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
      >
        Catégories
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50 py-2">
          <Link
            href="/categories"
            className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            onClick={handleItemClick}
          >
            Toutes les catégories
          </Link>
          <div className="border-t border-border my-2" />
          {loading ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">Chargement...</div>
          ) : categories.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.id}>
                  <Link
                    href={`/categories/${category.slug || category.id}`}
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    onClick={handleItemClick}
                  >
                    <div className="flex items-center justify-between">
                      <span>{category.name}</span>
                      {category._count?.products !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {category._count.products}
                        </span>
                      )}
                    </div>
                  </Link>
                  {category.children && category.children.length > 0 && (
                    <div className="ml-4 border-l border-border">
                      {category.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/categories/${child.slug || child.id}`}
                          className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          onClick={handleItemClick}
                        >
                          {child.name}
                          {child._count?.products !== undefined && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({child._count.products})
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-muted-foreground">Aucune catégorie</div>
          )}
        </div>
      )}
    </div>
  )
}
