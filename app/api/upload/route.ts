import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { UserRole } from "@prisma/client"
import { isBlobStorageConfigured } from "@/lib/storage/vercel-blob"
import { uploadProductImage } from "@/lib/storage/upload-image"

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      )
    }

    const allowedRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Accès refusé. Permissions insuffisantes." },
        { status: 403 }
      )
    }

    if (process.env.VERCEL === "1" && !isBlobStorageConfigured()) {
      return NextResponse.json(
        {
          error:
            "Upload indisponible : créez un Blob store dans Vercel → Storage et liez-le à ce projet (BLOB_READ_WRITE_TOKEN).",
        },
        { status: 503 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Le fichier doit être une image" },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (max 5MB)" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { url, storage } = await uploadProductImage(file, buffer)

    return NextResponse.json({ url, storage })
  } catch (error: unknown) {
    console.error("Error uploading file:", error)
    const message = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier", details: message },
      { status: 500 }
    )
  }
}
