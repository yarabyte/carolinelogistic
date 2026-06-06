import { PrismaClient, UserRole } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"

dotenv.config()

function createSeedClient(): PrismaClient {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL
  if (!url) {
    throw new Error("DIRECT_URL (ou DATABASE_URL) doit être défini")
  }

  const pool = new pg.Pool({
    connectionString: url,
    ssl: url.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
  })

  return new PrismaClient({ adapter: new PrismaPg(pool) })
}

const prisma = createSeedClient()

async function main() {
  console.log("🌱 Starting seed...")

  const hashedPassword = await bcrypt.hash("admin123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@carolinelogistics.com" },
    update: { password: hashedPassword },
    create: {
      email: "admin@carolinelogistics.com",
      password: hashedPassword,
      name: "Administrateur",
      role: UserRole.ADMIN,
      isActive: true,
    },
  })

  await prisma.user.upsert({
    where: { email: "manager@carolinelogistics.com" },
    update: { password: hashedPassword },
    create: {
      email: "manager@carolinelogistics.com",
      password: hashedPassword,
      name: "Manager",
      role: UserRole.MANAGER,
      isActive: true,
    },
  })

  console.log("✅ Seed completed. Admin:", admin.email)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
