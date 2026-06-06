"use client"

import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { resolveImageUrl } from "@/lib/utils/image-url"

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onChange, maxImages = 10 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const filesArray = Array.from(files)
    const remainingSlots = maxImages - images.length

    if (filesArray.length > remainingSlots) {
      alert(`Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s)`)
      return
    }

    setUploading(true)

    try {
      const uploadPromises = filesArray.map(async (file) => {
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
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      onChange([...images, ...uploadedUrls])
    } catch (error: any) {
      alert(error.message || "Erreur lors de l'upload des images")
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
      handleUpload(e.dataTransfer.files)
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const addUrl = () => {
    const url = prompt("Entrez l'URL de l'image:")
    if (url && url.trim()) {
      if (images.length >= maxImages) {
        alert(`Vous ne pouvez ajouter que ${maxImages} image(s) maximum`)
        return
      }
      onChange([...images, url.trim()])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Images ({images.length}/{maxImages})
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addUrl}
          disabled={images.length >= maxImages}
        >
          Ajouter une URL
        </Button>
      </div>

      {/* Zone de drop */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? "border-primary bg-primary/5" : "border-border"}
          ${images.length >= maxImages ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}
        `}
        onClick={() => {
          if (images.length < maxImages && !uploading) {
            fileInputRef.current?.click()
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
          disabled={images.length >= maxImages || uploading}
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
                Cliquez ou glissez-déposez des images ici
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF jusqu'à 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Liste des images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted"
            >
              <Image
                src={resolveImageUrl(image)}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback si l'image ne charge pas
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.jpg"
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                {image}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
