"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  Loader2,
  UsersRound,
  Mail,
  Shield,
  UserCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "STAFF", label: "Équipe (STAFF)" },
  { value: "MANAGER", label: "Gestionnaire" },
  { value: "ADMIN", label: "Administrateur" },
]

export default function NewUserPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    email: "",
    name: "",
    role: "STAFF" as UserRole,
    isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.email.trim()) {
      setError("L’e-mail est requis")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          name: form.name.trim() || null,
          role: form.role,
          isActive: form.isActive,
        }),
      })

      const data = (await res.json()) as {
        error?: string
        emailSent?: boolean
        emailError?: string
      }

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création")
      }

      if (data.emailSent) {
        toast({
          variant: "success",
          title: "Utilisateur créé",
          description: "Un e-mail avec l’URL de connexion et le mot de passe temporaire a été envoyé.",
        })
      } else {
        toast({
          variant: "default",
          title: "Utilisateur créé",
          description:
            data.emailError ||
            "L’e-mail n’a pas pu être envoyé (SMTP). Communiquez les accès manuellement ou vérifiez la configuration.",
        })
      }

      router.push("/admin/users")
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

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
              <Link href="/admin/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Liste des utilisateurs
              </Link>
            </Button>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md sm:h-14 sm:w-14">
                <UsersRound className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Utilisateurs · création
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Nouvel utilisateur
                </h1>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                  Un mot de passe fort est généré automatiquement et envoyé par e-mail à l’adresse
                  indiquée, avec le lien vers la page de connexion admin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl overflow-hidden border-2 border-border shadow-md">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCircle className="h-5 w-5 text-primary" />
              Identité &amp; accès
            </CardTitle>
            <CardDescription>
              Réservé aux administrateurs. Le compte est créé immédiatement ; l’utilisateur reçoit ses
              identifiants par mail.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                E-mail <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="prenom.nom@exemple.com"
                  className="h-11 border-border/80 pl-10 shadow-inner"
                />
              </div>
              <p className="text-xs text-muted-foreground">Servira d’identifiant de connexion.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Nom affiché
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Optionnel"
                className="h-11 border-border/80 shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2 text-foreground">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Rôle
              </Label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="h-11 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Les administrateurs ont accès à tous les écrans, y compris utilisateurs et paramètres.
              </p>
            </div>

            <label
              htmlFor="isActive"
              className={cn(
                "flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30",
                form.isActive && "border-primary/30 ring-1 ring-primary/15"
              )}
            >
              <div>
                <span className="font-medium text-foreground">Compte actif</span>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Si désactivé, la personne ne pourra pas se connecter.
                </p>
              </div>
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-5 w-5 shrink-0 rounded border-input text-primary focus:ring-ring"
              />
            </label>

            <div className="flex flex-wrap gap-3 border-t border-border pt-6">
              <Button type="submit" size="lg" disabled={saving} className="min-w-[160px]">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création…
                  </>
                ) : (
                  "Créer et envoyer l’e-mail"
                )}
              </Button>
              <Button type="button" variant="outline" size="lg" asChild>
                <Link href="/admin/users">Annuler</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
