import { z } from "zod"
import { UserRole } from "@prisma/client"

/** Création d’un compte back-office par un administrateur (mot de passe généré côté serveur). */
export const createAdminUserSchema = z.object({
  email: z.string().email("Adresse e-mail invalide").transform((s) => s.trim().toLowerCase()),
  name: z.string().max(120, "Le nom est trop long").optional().nullable(),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: "Rôle invalide" }) }),
  isActive: z.boolean().default(true),
})
