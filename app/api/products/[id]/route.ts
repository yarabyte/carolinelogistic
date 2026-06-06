import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { updateProductSchema } from "@/lib/validations/product"
import { requireRole } from "@/lib/auth/session"
import { UserRole } from "@prisma/client"
import { logActivity } from "@/lib/utils/activity-log"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params)
    const identifier = resolvedParams.id
    
    if (!identifier) {
      return NextResponse.json(
        { error: "Product identifier is required" },
        { status: 400 }
      )
    }
    
    console.log("Fetching product with identifier:", identifier)
    
    // Try to find by slug first, then by id
    try {
      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { slug: identifier },
            { id: identifier },
          ],
        },
        include: {
          category: true,
          partner: true,
        },
      })

      console.log("Product found:", product ? "yes" : "no")

      if (!product) {
        return NextResponse.json(
          { error: "Product not found", identifier },
          { status: 404 }
        )
      }

      return NextResponse.json(product)
    } catch (prismaError: any) {
      // Si erreur liée à des colonnes manquantes, utiliser le fallback
      const errorMessage = prismaError.message || ""
      const errorCode = prismaError.code || ""
      
      if (
        errorMessage.includes("Unknown column") ||
        errorMessage.includes("does not exist") ||
        errorCode === "P2021" ||
        errorMessage.includes("Column") && errorMessage.includes("doesn't exist")
      ) {
        console.log("Detected missing columns, using fallback query...")
        throw prismaError // Re-throw pour être capturé par le catch principal
      }
      
      // Si c'est une autre erreur, la re-lancer
      throw prismaError
    }
  } catch (error: any) {
    console.error("Error fetching product:", error)
    console.error("Error message:", error.message)
    console.error("Error code:", error.code)
    console.error("Error stack:", error.stack)
    
    // Si l'erreur est liée à des colonnes manquantes, essayer sans les nouveaux champs
    const errorMessage = error.message || ""
    const errorCode = error.code || ""
    
    const isColumnError = 
      errorMessage.includes("Unknown column") ||
      errorMessage.includes("does not exist") ||
      errorCode === "P2021" ||
      (errorMessage.includes("Column") && errorMessage.includes("doesn't exist")) ||
      errorMessage.includes("Unknown column 'slug'") ||
      errorMessage.includes("Unknown column 'seoTitle'") ||
      errorMessage.includes("Unknown column 'seoDescription'")
    
    if (isColumnError) {
      console.log("Detected missing columns (slug/seoTitle/seoDescription), attempting fallback query...")
      try {
        // Requête SQL brute pour éviter les problèmes de colonnes manquantes
        const products = await prisma.$queryRaw<Array<any>>`
          SELECT 
            id, title, description, price, dimensions, weight, stock, tva,
            images, "categoryId", "isPartner", "partnerId", "externalLink",
            views, clicks, "isFeatured", "isActive",
            "createdAt", "updatedAt"
          FROM products
          WHERE id = ${productId}
        `
        
        if (!products || products.length === 0) {
          return NextResponse.json(
            { error: "Product not found", id: productId },
            { status: 404 }
          )
        }
        
        const productData = products[0]
        
        // Récupérer la catégorie et le partenaire séparément si nécessaire
        let category = null
        let partner = null
        
        if (productData.categoryId) {
          try {
            const categories = await prisma.$queryRaw<Array<any>>`
              SELECT id, name, slug FROM categories WHERE id = ${productData.categoryId}
            `
            category = categories && categories.length > 0 ? categories[0] : null
          } catch (e: any) {
            console.error("Error fetching category:", e.message)
          }
        }
        
        if (productData.partnerId) {
          try {
            const partners = await prisma.$queryRaw<Array<any>>`
              SELECT id, name, logo FROM partners WHERE id = ${productData.partnerId}
            `
            partner = partners && partners.length > 0 ? partners[0] : null
          } catch (e: any) {
            console.error("Error fetching partner:", e.message)
          }
        }
        
        // Convertir images JSON si nécessaire
        let images = []
        try {
          if (productData.images) {
            images = typeof productData.images === 'string' 
              ? JSON.parse(productData.images) 
              : productData.images
          }
        } catch (e) {
          console.error("Error parsing images:", e)
        }
        
        return NextResponse.json({
          ...productData,
          images,
          slug: null,
          seoTitle: null,
          seoDescription: null,
          category,
          partner,
        })
      } catch (fallbackError: any) {
        console.error("Fallback query also failed:", fallbackError)
        console.error("Fallback error message:", fallbackError.message)
        return NextResponse.json(
          { 
            error: "Failed to fetch product (database schema mismatch)", 
            details: "Les colonnes slug, seoTitle, ou seoDescription n'existent pas encore dans la base de données. Veuillez exécuter: pnpm db:push",
            originalError: error.message,
            fallbackError: fallbackError.message,
            id: productId 
          },
          { status: 500 }
        )
      }
    }
    
    // Autre type d'erreur
    return NextResponse.json(
      { 
        error: "Failed to fetch product", 
        details: error.message || "Erreur inconnue",
        id: productId,
        code: error.code,
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params)
    const productId = resolvedParams.id
    
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }
    
    const user = await requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF])
    const body = await req.json()
    const data = updateProductSchema.parse({ ...body, id: productId })

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Générer le slug si le titre change et qu'aucun slug n'est fourni
    let slug = data.slug
    if (data.title && (!slug || slug === existing.slug)) {
      slug = data.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    }

    // Vérifier d'abord si les colonnes SEO existent en essayant une requête simple
    let hasSeoColumns = false
    try {
      // Essayer de récupérer un produit avec les champs SEO pour vérifier s'ils existent
      const testProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          slug: true,
          seoTitle: true,
          seoDescription: true,
        },
      })
      hasSeoColumns = testProduct !== null // Si la requête réussit, les colonnes existent
    } catch (e: any) {
      // Si erreur, les colonnes n'existent probablement pas
      const errorMsg = e.message || ""
      if (
        errorMsg.includes("Unknown column") ||
        errorMsg.includes("does not exist") ||
        errorMsg.includes("Unknown argument") ||
        e.code === "P2021"
      ) {
        hasSeoColumns = false
        console.log("SEO columns (slug, seoTitle, seoDescription) do not exist, updating without them")
      } else {
        // Autre erreur, on essaie quand même avec tous les champs
        hasSeoColumns = true
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      title: data.title,
      price: data.price,
      stock: data.stock,
      isPartner: data.isPartner,
      isFeatured: data.isFeatured,
      isActive: data.isActive,
    }

    // Ajouter les champs optionnels
    if (data.description !== undefined) {
      updateData.description = data.description
    }
    if (data.dimensions !== undefined) {
      updateData.dimensions = data.dimensions
    }
    if (data.weight !== undefined) {
      updateData.weight = data.weight
    }
    if (data.tva !== undefined) {
      updateData.tva = data.tva
    }
    if (data.images !== undefined) {
      updateData.images = data.images
    }
    if (data.externalLink !== undefined) {
      updateData.externalLink = data.externalLink
    }

    // Gérer categoryId en utilisant la syntaxe Prisma standard
    if (data.categoryId !== undefined) {
      if (data.categoryId === null || data.categoryId === "") {
        // Déconnecter la catégorie
        updateData.category = { disconnect: true }
      } else {
        // Connecter la catégorie
        updateData.category = { connect: { id: data.categoryId } }
      }
    }

    // Gérer partnerId en utilisant la syntaxe Prisma standard
    if (data.partnerId !== undefined) {
      if (data.partnerId === null || data.partnerId === "") {
        // Déconnecter le partenaire
        updateData.partner = { disconnect: true }
      } else {
        // Connecter le partenaire
        updateData.partner = { connect: { id: data.partnerId } }
      }
    }

    // Ajouter les champs SEO seulement s'ils existent
    if (hasSeoColumns) {
      if (data.slug !== undefined) {
        updateData.slug = data.slug || slug || null
      }
      if (data.seoTitle !== undefined) {
        updateData.seoTitle = data.seoTitle || null
      }
      if (data.seoDescription !== undefined) {
        updateData.seoDescription = data.seoDescription || null
      }
    }

    // Mettre à jour le produit
    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
        partner: true,
      },
    })

    // Ajouter les champs SEO dans la réponse même s'ils n'ont pas été sauvegardés
    const productResponse: any = {
      ...product,
    }

    if (!hasSeoColumns) {
      productResponse.slug = data.slug || slug || null
      productResponse.seoTitle = data.seoTitle || null
      productResponse.seoDescription = data.seoDescription || null
    }

    await logActivity("UPDATE", "Product", product.id, {
      title: product.title,
    })

    return NextResponse.json(productResponse)
  } catch (error: any) {
    console.error("Error updating product:", error)
    console.error("Error message:", error.message)
    console.error("Error code:", error.code)
    console.error("Error stack:", error.stack)
    
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    
    // Vérifier si c'est une erreur d'authentification
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Failed to update product",
        details: error.message || "Erreur inconnue",
        code: error.code,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params)
    const productId = resolvedParams.id
    
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }
    
    const user = await requireRole([UserRole.ADMIN, UserRole.MANAGER])

    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    await prisma.product.delete({
      where: { id: productId },
    })

    await logActivity("DELETE", "Product", productId, {
      title: product.title,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}
