"use client"

import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { resolveImageUrl } from "@/lib/utils/image-url"

interface LogoUploadProps {
  value: string
  onChange: (url: string) => void
}

export function LogoUpload({ value, onChange }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Le fichier doit être une image")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (max 5MB)")
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        // Vérifier si la réponse est du JSON
        const contentType = res.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const error = await res.json()
          throw new Error(error.error || "Erreur lors de l'upload")
        } else {
          // Si ce n'est pas du JSON, c'est probablement une redirection HTML
          throw new Error("Erreur d'authentification. Veuillez vous reconnecter.")
        }
      }

      const contentType = res.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Réponse invalide du serveur")
      }

      const data = await res.json()
      onChange(data.url)
    } catch (error: any) {
      console.error("Upload error:", error)
      alert(error.message || "Erreur lors de l'upload de l'image")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  const removeLogo = () => {
    onChange("")
  }

  return (
    <div className="space-y-4">

      {value ? (
        <div className="relative">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border bg-muted">
            <Image
              src={resolveImageUrl(value)}
              alt="Logo"
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder-logo.png"
              }}
            />
            <button
              type="button"
              onClick={removeLogo}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 truncate">{value}</p>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragActive ? "border-primary bg-primary/5" : "border-border"}
            cursor-pointer hover:border-primary/50
          `}
          onClick={() => {
            if (!uploading) {
              fileInputRef.current?.click()
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUpload(e.target.files[0])
              }
            }}
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Cliquez ou glissez-déposez un logo ici
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF jusqu'à 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
