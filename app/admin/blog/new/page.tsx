"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Loader2,
  Newspaper,
  Type,
  Link2,
  ImageIcon,
  AlignLeft,
  Calendar,
  Eye,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ImageUpload } from "@/components/admin/image-upload"
import { RichTextEditor } from "@/components/admin/richtext-editor"
import { cn } from "@/lib/utils"

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function postImageSrc(image: string) {
  if (!image) return ""
  if (image.startsWith("http") || image.startsWith("/")) return image
  return `/${image}`
}

export default function NewBlogPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image: "",
    publishedAt: "",
    isActive: true,
  })

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || slugify(title),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!formData.title.trim()) {
      setError("Le titre est requis")
      return
    }
    if (!formData.slug.trim()) {
      setError("Le slug est requis")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          excerpt: formData.excerpt.trim() || null,
          content: formData.content.trim() || null,
          image: formData.image || null,
          publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : null,
          isActive: formData.isActive,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || "Erreur lors de la création")
      }

      router.push("/admin/blog")
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const previewSrc = postImageSrc(formData.image)

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
              <Link href="/admin/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Liste des articles
              </Link>
            </Button>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md sm:h-14 sm:w-14">
                <Newspaper className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Blog · création
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Nouvel article
                </h1>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                  Titre, slug URL, extrait pour les cartes, image optionnelle et contenu riche. Le slug
                  se remplit automatiquement à partir du titre tant que vous ne l&apos;avez pas
                  modifié.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                  Titre &amp; URL
                </CardTitle>
                <CardDescription>Le slug définit l&apos;adresse publique de l&apos;article.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground">
                    Titre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ex. Nos conseils logistique"
                    className="h-11 border-border/80 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-foreground">
                    Slug (URL) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="nos-conseils-logistique"
                    className="h-11 border-border/80 font-mono text-sm shadow-inner"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL : <span className="font-mono">/blog/{formData.slug || "…"}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excerpt" className="text-foreground">
                    Extrait / résumé
                  </Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Court texte pour les listes, la page d’accueil et le SEO…"
                    rows={3}
                    className="resize-y border-border/80 shadow-inner"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-2 border-border shadow-md">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Image
                </CardTitle>
                <CardDescription>
                  Optionnel : si vide, l&apos;image par défaut du blog (paramètres) sera utilisée.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
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
                  <AlignLeft className="h-5 w-5 text-primary" />
                  Contenu
                </CardTitle>
                <CardDescription>Éditeur riche : titres, listes, liens, etc.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-6">
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Rédigez le corps de l’article…"
                />
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-2 border-border shadow-md">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Publication
                </CardTitle>
                <CardDescription>Date affichée sur l&apos;article et visibilité.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="max-w-md space-y-2">
                  <Label htmlFor="publishedAt" className="text-foreground">
                    Date de publication
                  </Label>
                  <Input
                    id="publishedAt"
                    type="datetime-local"
                    value={formData.publishedAt}
                    onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                    className="h-11 border-border/80 shadow-inner"
                  />
                  <p className="text-xs text-muted-foreground">
                    Laissez vide pour ne pas afficher de date (vous pourrez la compléter plus tard).
                  </p>
                </div>

                <label
                  htmlFor="isActive"
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30",
                    formData.isActive && "border-primary/30 ring-1 ring-primary/15"
                  )}
                >
                  <div>
                    <span className="font-medium text-foreground">Article actif</span>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Visible sur le blog et éligible aux extraits sur l&apos;accueil (selon les règles
                      du site).
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
                <Button type="submit" size="lg" disabled={saving} className="min-w-[160px]">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création…
                    </>
                  ) : (
                    "Créer l’article"
                  )}
                </Button>
                <Button type="button" variant="outline" size="lg" asChild>
                  <Link href="/admin/blog">Annuler</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Après création, vous serez renvoyé vers la liste des articles.
              </p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-6">
            <Card className="overflow-hidden border-2 border-border shadow-md">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-primary" />
                  Aperçu carte
                </CardTitle>
                <CardDescription>Rendu proche d&apos;une carte blog / liste.</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  <div className="relative aspect-[16/10] bg-muted">
                    {previewSrc ? (
                      <Image
                        src={previewSrc}
                        alt={formData.title || "Aperçu"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 360px"
                      />
                    ) : (
                      <div className="flex h-full min-h-[140px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
                        Image optionnelle — l&apos;illustration par défaut sera utilisée sur le site
                        si vide.
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="line-clamp-2 text-lg font-semibold leading-snug text-foreground">
                      {formData.title || "Titre de l’article"}
                    </p>
                    {formData.excerpt ? (
                      <p className="line-clamp-3 text-sm text-muted-foreground">{formData.excerpt}</p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">Aucun extrait pour l’instant</p>
                    )}
                    <p className="flex items-center gap-1 pt-1 font-mono text-xs text-muted-foreground">
                      <Link2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">/blog/{formData.slug || "slug"}</span>
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          formData.isActive
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {formData.isActive ? "Actif" : "Inactif"}
                      </span>
                      {formData.publishedAt ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Date renseignée
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </form>
    </div>
  )
}
