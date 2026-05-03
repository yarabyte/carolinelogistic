import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import bcrypt from "bcryptjs"
import { Prisma, UserRole } from "@prisma/client"
import { ZodError } from "zod"
import { prisma } from "@/lib/db/prisma"
import { requireRole } from "@/lib/auth/session"
import { createAdminUserSchema } from "@/lib/validations/user"
import { logActivity } from "@/lib/utils/activity-log"
import { sendNewUserAccessEmail } from "@/lib/email"

function generateTemporaryPassword(length = 16) {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
  const bytes = randomBytes(length)
  let out = ""
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i]! % alphabet.length]!
  }
  return out
}

export async function POST(req: NextRequest) {
  try {
    await requireRole([UserRole.ADMIN])
    const body = await req.json()
    const data = createAdminUserSchema.parse(body)

    const name =
      data.name != null && String(data.name).trim() !== ""
        ? String(data.name).trim().slice(0, 120)
        : null

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json(
        { error: "Un utilisateur existe déjà avec cet e-mail." },
        { status: 409 }
      )
    }

    const plainPassword = generateTemporaryPassword()
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name,
        password: hashedPassword,
        role: data.role,
        isActive: data.isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    await logActivity("CREATE", "User", user.id, { email: user.email, role: user.role })

    const base =
      (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.replace(/\/$/, "")) || req.nextUrl.origin
    const loginUrl = `${base}/admin/login`

    const emailResult = await sendNewUserAccessEmail({
      to: user.email,
      recipientName: user.name,
      loginEmail: user.email,
      plainPassword,
      loginUrl,
    })

    return NextResponse.json(
      {
        user,
        emailSent: emailResult.ok,
        emailError: emailResult.ok ? undefined : emailResult.error,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("POST /api/users:", error)
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof ZodError) {
      const msg = error.errors[0]?.message || "Données invalides"
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Cet e-mail est déjà utilisé." }, { status: 409 })
    }
    return NextResponse.json({ error: "Échec de la création de l’utilisateur." }, { status: 500 })
  }
}
