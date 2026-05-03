"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Loader2,
  LayoutPanelLeft,
  Type,
  ImageIcon,
  MousePointerClick,
  ListOrdered,
  Eye,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ImageUpload } from "@/components/admin/image-upload"
import { cn } from "@/lib/utils"

function slideImageSrc(image: string) {
  if (!image) return ""
  if (image.startsWith("http") || image.startsWith("/")) return image
  return `/${image}`
}

export default function EditHeroSlidePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: "",
    ctaText: "",
    ctaLink: "",
    badge: "",
    order: 0,
    isActive: true,
  })

  useEffect(() => {
    const fetchSlide = async () => {
      try {
        const res = await fetch(`/api/hero-slides/${id}`)
        if (!res.ok) throw new Error("Slide non trouvé")
        const data = (await res.json()) as {
          title?: string
          subtitle?: string | null
          description?: string | null
          image?: string
          ctaText?: string | null
          ctaLink?: string | null
          badge?: string | null
          sortOrder?: number
          isActive?: boolean
        }
        setFormData({
          title: data.title || "",
          subtitle: data.subtitle || "",
          description: data.description || "",
          image: data.image || "",
          ctaText: data.ctaText || "",
          ctaLink: data.ctaLink || "",
          badge: data.badge || "",
          order: data.sortOrder ?? 0,
          isActive: data.isActive ?? true,
        })
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Erreur"
        setLoadError(message)
      } finally {
        setLoading(false)
      }
    }
    void fetchSlide()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!formData.title.trim()) {
      setError("Le titre est requis")
      return
    }
    if (!formData.image) {
      setError("L'image est requise")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/hero-slides/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          subtitle: formData.subtitle || null,
          description: formData.description || null,
          ctaText: formData.ctaText || null,
          ctaLink: formData.ctaLink || null,
          badge: formData.badge || null,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || "Erreur lors de la mise à jour")
      }

      router.push("/admin/hero-slides")
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const previewSrc = slideImageSrc(formData.image)

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Button
              variant="outline"
              size="sm"
              className="w-fit shrink-0 border-border/80 bg-background/80 shadow-sm"
              asChild
            >
              <Link href="/admin/hero-slides">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Liste des slides
              </Link>
            </Button>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md sm:h-14 sm:w-14">
                <LayoutPanelLeft className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Hero · édition
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Modifier le slide
                </h1>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                  Texte, visuel et bouton tels qu&apos;affichés sur la page d&apos;accueil. L&apos;ordre
                  définit la position dans le carrousel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/15 py-24">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement du slide…</p>
        </div>
      ) : loadError ? (
        <Card className="border-2 border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button variant="outline" asChild>
              <Link href="/admin/hero-slides">Retour à la liste</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_min(360px,100%)] lg:items-start">
            <div className="space-y-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              <Card className="overflow-hidden border-2 border-border shadow-md">
                <CardHeader className="border-b border-border bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Type className="h-5 w-5 text-primary" />
                    Textes
                  </CardTitle>
                  <CardDescription>Titre, sous-titre, description longue et badge optionnel.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-foreground">
                      Titre <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex. Découvrez nos produits"
                      className="h-11 border-border/80 shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle" className="text-foreground">
                      Sous-titre
                    </Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="Ex. Nouvelle collection"
                      className="h-11 border-border/80 shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-foreground">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Texte d’accroche sous le titre…"
                      rows={4}
                      className="resize-y border-border/80 shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="badge" className="text-foreground">
                      Badge (promo)
                    </Label>
                    <Input
                      id="badge"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="Ex. -30 %"
                      className="h-11 max-w-xs border-border/80 font-medium shadow-inner"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-2 border-border shadow-md">
                <CardHeader className="border-b border-border bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Image du slide
                  </CardTitle>
                  <CardDescription>
                    Image large recommandée pour le bandeau (ratio paysage).
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Label className="mb-3 block text-foreground">
                    Fichier <span className="text-destructive">*</span>
                  </Label>
                  <ImageUpload
                    images={formData.image ? [formData.image] : []}
                    onChange={(urls) => setFormData({ ...formData, image: urls[0] || "" })}
                    maxImages={1}
                  />
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-2 border-border shadow-md">
                <CardHeader className="border-b border-border bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MousePointerClick className="h-5 w-5 text-primary" />
                    Bouton d&apos;action
                  </CardTitle>
                  <CardDescription>Libellé et URL du lien principal du slide.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ctaText" className="text-foreground">
                      Texte du bouton
                    </Label>
                    <Input
                      id="ctaText"
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      placeholder="Voir la boutique"
                      className="h-11 border-border/80 shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ctaLink" className="text-foreground">
                      Lien (URL ou chemin)
                    </Label>
                    <Input
                      id="ctaLink"
                      value={formData.ctaLink}
                      onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                      placeholder="/boutique"
                      className="h-11 border-border/80 font-mono text-sm shadow-inner"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-2 border-border shadow-md">
                <CardHeader className="border-b border-border bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ListOrdered className="h-5 w-5 text-primary" />
                    Publication
                  </CardTitle>
                  <CardDescription>Ordre dans le carrousel et visibilité sur le site public.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="max-w-xs space-y-2">
                    <Label htmlFor="order" className="text-foreground">
                      Ordre d&apos;affichage
                    </Label>
                    <Input
                      id="order"
                      type="number"
                      min={0}
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })
                      }
                      className="h-11 border-border/80 font-mono shadow-inner"
                    />
                    <p className="text-xs text-muted-foreground">0 = en premier, puis 1, 2…</p>
                  </div>

                  <label
                    htmlFor="isActive"
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30",
                      formData.isActive && "border-primary/30 ring-1 ring-primary/15"
                    )}
                  >
                    <div>
                      <span className="font-medium text-foreground">Slide actif</span>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Visible sur la page d&apos;accueil lorsque la période / le carrousel le permet.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-5 w-5 shrink-0 rounded border-input text-primary focus:ring-ring"
                    />
                  </label>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3 border-t border-border pt-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" size="lg" disabled={saving} className="min-w-[140px]">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement…
                      </>
                    ) : (
                      "Enregistrer"
                    )}
                  </Button>
                  <Button type="button" variant="outline" size="lg" asChild>
                    <Link href="/admin/hero-slides">Annuler</Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Les visiteurs voient les changements après enregistrement (rafraîchir l&apos;accueil).
                </p>
              </div>
            </div>

            <aside className="lg:sticky lg:top-6">
              <Card className="overflow-hidden border-2 border-border shadow-md">
                <CardHeader className="border-b border-border bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="h-5 w-5 text-primary" />
                    Aperçu
                  </CardTitle>
                  <CardDescription>Rendu approximatif du bandeau.</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="relative aspect-[21/9] overflow-hidden rounded-xl border border-border bg-muted">
                    {previewSrc ? (
                      <Image
                        src={previewSrc}
                        alt={formData.title || "Aperçu slide"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 360px"
                      />
                    ) : (
                      <div className="flex h-full min-h-[120px] items-center justify-center text-sm text-muted-foreground">
                        Ajoutez une image
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      {formData.badge ? (
                        <span className="mb-2 inline-block rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
                          {formData.badge}
                        </span>
                      ) : null}
                      <p className="text-lg font-bold leading-tight drop-shadow-md sm:text-xl">
                        {formData.title || "Titre du slide"}
                      </p>
                      {formData.subtitle ? (
                        <p className="mt-1 line-clamp-2 text-sm text-white/90 drop-shadow">
                          {formData.subtitle}
                        </p>
                      ) : null}
                      {formData.ctaText ? (
                        <span className="mt-3 inline-block rounded-lg bg-white/25 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                          {formData.ctaText}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-medium",
                        formData.isActive
                          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {formData.isActive ? "Actif" : "Inactif"}
                    </span>
                    <span>·</span>
                    <span className="font-mono">Ordre {formData.order}</span>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </form>
      )}
    </div>
  )
}
