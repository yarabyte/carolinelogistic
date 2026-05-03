"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Settings,
  Building2,
  Mail,
  Percent,
  Euro,
  ImageIcon,
  Share2,
  Loader2,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { LogoUpload } from "@/components/admin/logo-upload"

interface SettingsState {
  companyName: string | null
  logo: string | null
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  defaultTva: number | null
  currency: string | null
  systemEmail: string | null
  facebookUrl: string | null
  twitterUrl: string | null
  instagramUrl: string | null
  linkedinUrl: string | null
  tiktokUrl: string | null
  defaultBlogImage: string | null
}

const emptySettings: SettingsState = {
  companyName: null,
  logo: null,
  contactEmail: null,
  contactPhone: null,
  address: null,
  defaultTva: null,
  currency: null,
  systemEmail: null,
  facebookUrl: null,
  twitterUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  tiktokUrl: null,
  defaultBlogImage: null,
}

function isSettingsRecord(data: unknown): data is SettingsState {
  return typeof data === "object" && data !== null && "companyName" in data
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(emptySettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings")
        const data: unknown = await res.json()
        if (isSettingsRecord(data)) {
          setSettings(data)
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    void fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement unique au montage
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        toast({
          variant: "success",
          title: "Paramètres sauvegardés",
          description: "Vos modifications ont été enregistrées.",
        })
      } else {
        const err = (await res.json()) as { error?: string; details?: unknown }
        toast({
          title: "Erreur",
          description: err.error || "Erreur lors de la sauvegarde",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Settings className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Paramètres
              </h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                Chargement de la configuration…
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/15 py-24">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement des paramètres…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Settings className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Paramètres
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Identité de la boutique, contacts, TVA / devise, image blog par défaut et liens réseaux
              sociaux utilisés sur le site public.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="overflow-hidden border-2 border-border shadow-md">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-5 w-5 text-primary" />
              Entreprise
            </CardTitle>
            <CardDescription>Nom, logo et adresse postale affichés sur le site.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-foreground">
                Nom de l&apos;entreprise <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                value={settings.companyName || ""}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                required
                className="h-11 max-w-xl border-border/80 shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Logo</Label>
              <p className="text-xs text-muted-foreground">
                Utilisé dans l&apos;en-tête et les e-mails selon les gabarits.
              </p>
              <LogoUpload
                value={settings.logo || ""}
                onChange={(url) => setSettings({ ...settings, logo: url })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-foreground">
                Adresse
              </Label>
              <Textarea
                id="address"
                value={settings.address || ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows={3}
                className="resize-y border-border/80 shadow-inner"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-border shadow-md">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Mail className="h-5 w-5 text-primary" />
              Contact
            </CardTitle>
            <CardDescription>E-mails et téléphone visibles par les clients.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="text-foreground">
                E-mail de contact
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail || ""}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="h-11 border-border/80 shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="text-foreground">
                Téléphone
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                value={settings.contactPhone || ""}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="h-11 border-border/80 shadow-inner"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="systemEmail" className="text-foreground">
                E-mail système (expéditeur)
              </Label>
              <Input
                id="systemEmail"
                type="email"
                value={settings.systemEmail || ""}
                onChange={(e) => setSettings({ ...settings, systemEmail: e.target.value })}
                placeholder="noreply@votredomaine.fr"
                className="h-11 max-w-xl border-border/80 shadow-inner"
              />
              <p className="text-xs text-muted-foreground">
                Souvent aligné avec le compte SMTP (voir documentation hébergeur).
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-border shadow-md">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Percent className="h-5 w-5 text-primary" />
              Finances
            </CardTitle>
            <CardDescription>TVA par défaut et code devise pour les prix.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultTva" className="text-foreground">
                TVA par défaut (%)
              </Label>
              <Input
                id="defaultTva"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={settings.defaultTva ?? ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultTva: e.target.value === "" ? null : parseFloat(e.target.value),
                  })
                }
                className="h-11 max-w-xs border-border/80 font-mono shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency" className="flex items-center gap-2 text-foreground">
                <Euro className="h-4 w-4 text-muted-foreground" />
                Devise
              </Label>
              <Input
                id="currency"
                value={settings.currency || ""}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                placeholder="EUR"
                className="h-11 max-w-xs border-border/80 font-mono uppercase shadow-inner"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-border shadow-md">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ImageIcon className="h-5 w-5 text-primary" />
              Blog
            </CardTitle>
            <CardDescription>
              Image utilisée lorsqu&apos;un article n&apos;a pas de visuel propre.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Label className="mb-2 block text-foreground">Image par défaut des articles</Label>
            <LogoUpload
              value={settings.defaultBlogImage || ""}
              onChange={(url) => setSettings({ ...settings, defaultBlogImage: url })}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-border shadow-md">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Share2 className="h-5 w-5 text-primary" />
              Réseaux sociaux
            </CardTitle>
            <CardDescription>URLs complètes (https://…). Laisser vide pour masquer l&apos;icône.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="facebookUrl" className="flex items-center gap-2 text-foreground">
                <Facebook className="h-4 w-4 text-muted-foreground" />
                Facebook
              </Label>
              <Input
                id="facebookUrl"
                type="url"
                value={settings.facebookUrl || ""}
                onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/…"
                className="h-11 border-border/80 font-mono text-sm shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitterUrl" className="text-foreground">
                X (Twitter)
              </Label>
              <Input
                id="twitterUrl"
                type="url"
                value={settings.twitterUrl || ""}
                onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                placeholder="https://x.com/…"
                className="h-11 border-border/80 font-mono text-sm shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramUrl" className="flex items-center gap-2 text-foreground">
                <Instagram className="h-4 w-4 text-muted-foreground" />
                Instagram
              </Label>
              <Input
                id="instagramUrl"
                type="url"
                value={settings.instagramUrl || ""}
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/…"
                className="h-11 border-border/80 font-mono text-sm shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl" className="flex items-center gap-2 text-foreground">
                <Linkedin className="h-4 w-4 text-muted-foreground" />
                LinkedIn
              </Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={settings.linkedinUrl || ""}
                onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/…"
                className="h-11 border-border/80 font-mono text-sm shadow-inner"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tiktokUrl" className="text-foreground">
                TikTok
              </Label>
              <Input
                id="tiktokUrl"
                type="url"
                value={settings.tiktokUrl || ""}
                onChange={(e) => setSettings({ ...settings, tiktokUrl: e.target.value })}
                placeholder="https://tiktok.com/@…"
                className="h-11 max-w-xl border-border/80 font-mono text-sm shadow-inner"
              />
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 z-10 -mx-2 flex flex-col gap-3 rounded-xl border border-border bg-background/95 px-4 py-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-0 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground sm:max-w-md">
            Les visiteurs voient les changements après enregistrement (rafraîchir la page publique si
            besoin).
          </p>
          <Button type="submit" size="lg" disabled={saving} className="shrink-0 sm:min-w-[220px]">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde…
              </>
            ) : (
              "Enregistrer les paramètres"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
