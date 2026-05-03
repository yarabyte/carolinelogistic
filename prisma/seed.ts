import { PrismaClient, UserRole } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Parse DATABASE_URL to extract connection details
function parseDatabaseUrl(url: string) {
  try {
    const match = url.match(/^mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)$/)
    if (match) {
      const [, user, password, host, port, database] = match
      return {
        host,
        port: parseInt(port) || 3306,
        user,
        password: password || undefined,
        database: database.split('?')[0],
      }
    }
    
    const urlObj = new URL(url.replace('mysql://', 'http://'))
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 3306,
      user: urlObj.username || undefined,
      password: urlObj.password || undefined,
      database: urlObj.pathname.replace('/', '').split('?')[0],
    }
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL: ${url}. Error: ${error}`)
  }
}

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set in environment variables')
}

// Parse connection details
const connectionDetails = parseDatabaseUrl(databaseUrl)

// Create adapter
const adapterConfig: any = {
  host: connectionDetails.host,
  port: connectionDetails.port,
  user: connectionDetails.user,
  database: connectionDetails.database,
  connectionLimit: 10,
}

if (connectionDetails.password) {
  adapterConfig.password = connectionDetails.password
}

const adapter = new PrismaMariaDb(adapterConfig)

const prisma = new PrismaClient({
  adapter,
})

async function main() {
  console.log('🌱 Starting seed...')

  // Comptes admin (mot de passe par défaut : admin123 — à changer en production)
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@carolinelogistics.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@carolinelogistics.com',
      password: hashedPassword,
      name: 'Administrateur',
      role: UserRole.ADMIN,
      isActive: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@carolinelogistic.com' },
    update: {},
    create: {
      email: 'admin@carolinelogistic.com',
      password: hashedPassword,
      name: 'Administrateur (legacy)',
      role: UserRole.ADMIN,
      isActive: true,
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@carolinelogistic.com' },
    update: {},
    create: {
      email: 'manager@carolinelogistic.com',
      password: hashedPassword,
      name: 'Manager',
      role: UserRole.MANAGER,
      isActive: true,
    },
  })

  console.log('✅ Created users:', { admin: admin.email, manager: manager.email })

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronique' },
    update: {},
    create: {
      name: 'Électronique',
      slug: 'electronique',
      description: 'Produits électroniques et high-tech',
      seoTitle: 'Électronique - Caroline Logistic',
      seoDescription: 'Découvrez notre sélection de produits électroniques',
    },
  })

  const fashion = await prisma.category.upsert({
    where: { slug: 'mode' },
    update: {},
    create: {
      name: 'Mode',
      slug: 'mode',
      description: 'Vêtements et accessoires de mode',
      seoTitle: 'Mode - Caroline Logistic',
      seoDescription: 'Trouvez les dernières tendances mode',
    },
  })

  const beauty = await prisma.category.upsert({
    where: { slug: 'beaute' },
    update: {},
    create: {
      name: 'Beauté',
      slug: 'beaute',
      description: 'Produits de beauté et cosmétiques',
      seoTitle: 'Beauté - Caroline Logistic',
      seoDescription: 'Prenez soin de vous avec nos produits beauté',
    },
  })

  const home = await prisma.category.upsert({
    where: { slug: 'maison' },
    update: {},
    create: {
      name: 'Maison',
      slug: 'maison',
      description: 'Décoration et accessoires pour la maison',
      seoTitle: 'Maison - Caroline Logistic',
      seoDescription: 'Décorez votre intérieur avec style',
    },
  })

  console.log('✅ Created categories')

  // Create delivery zones
  const zone1 = await prisma.deliveryZone.upsert({
    where: { id: 'zone-yaounde' },
    update: {},
    create: {
      id: 'zone-yaounde',
      name: 'Yaoundé',
      price: 5000,
      isActive: true,
    },
  })

  const zone2 = await prisma.deliveryZone.upsert({
    where: { id: 'zone-douala' },
    update: {},
    create: {
      id: 'zone-douala',
      name: 'Douala',
      price: 5000,
      isActive: true,
    },
  })

  const zone3 = await prisma.deliveryZone.upsert({
    where: { id: 'zone-autres' },
    update: {},
    create: {
      id: 'zone-autres',
      name: 'Autres villes',
      price: 10000,
      isActive: true,
    },
  })

  console.log('✅ Created delivery zones')

  // Create sample products
  const product1 = await prisma.product.create({
    data: {
      title: 'Smartphone Premium X12',
      description: 'Smartphone haut de gamme avec écran AMOLED et appareil photo 108MP',
      price: 380,
      stock: 15,
      tva: 19.25,
      dimensions: '16.5 x 7.5 x 0.8 cm',
      weight: 180,
      categoryId: electronics.id,
      isFeatured: true,
      images: [
        '/images/products/smartwatch.jpg',
        '/images/products/headphones.jpg',
      ],
    },
  })

  const product2 = await prisma.product.create({
    data: {
      title: 'Montre Connectée Pro',
      description: 'Montre intelligente avec suivi de la santé et GPS',
      price: 120,
      stock: 30,
      tva: 19.25,
      dimensions: '4.5 x 4.5 x 1.2 cm',
      weight: 45,
      categoryId: electronics.id,
      isFeatured: true,
      images: [
        '/images/products/smartwatch.jpg',
      ],
    },
  })

  const product3 = await prisma.product.create({
    data: {
      title: 'Sac à Dos Business',
      description: 'Sac à dos professionnel avec compartiments multiples',
      price: 50,
      stock: 25,
      tva: 19.25,
      dimensions: '45 x 30 x 15 cm',
      weight: 800,
      categoryId: fashion.id,
      images: [
        '/images/products/leather-bag.jpg',
      ],
    },
  })

  const product4 = await prisma.product.create({
    data: {
      title: 'Crème Hydratante Bio',
      description: 'Crème hydratante naturelle pour tous types de peaux',
      price: 25,
      stock: 50,
      tva: 19.25,
      dimensions: '8 x 8 x 12 cm',
      weight: 100,
      categoryId: beauty.id,
      isFeatured: true,
      images: [
        '/images/products/skincare-set.jpg',
      ],
    },
  })

  console.log('✅ Created sample products')

  // Create settings
  const settings = await prisma.settings.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      companyName: 'Caroline Logistic',
      contactEmail: 'contact@carolinelogistic.com',
      contactPhone: '+33 X XX XX XX XX',
      defaultTva: 19.25,
      currency: 'EUR',
      systemEmail: 'noreply@carolinelogistic.com',
    },
  })

  console.log('✅ Created settings')

  // Create blog posts
  const blogPostsData = [
    {
      slug: 'logistique-e-commerce-2025',
      title: 'Logistique e-commerce : tendances 2025',
      excerpt: 'Découvrez les évolutions qui transforment la supply chain et la livraison en ligne cette année.',
      image: '/images/hero-shopping.jpg',
      content: `<p>L'année 2025 marque un tournant pour la logistique e-commerce. Entre automatisation des entrepôts, livraison express et traçabilité en temps réel, les acteurs doivent s'adapter pour rester compétitifs.</p>
<p><strong>Les points clés :</strong></p>
<ul>
<li>Robotisation et entrepôts intelligents</li>
<li>Dernier kilomètre : drones et lockers</li>
<li>Transparence carbone et logistique durable</li>
<li>IA pour la prévision des demandes</li>
</ul>
<p>Caroline Logistic accompagne les marques dans cette transition avec des solutions flexibles et scalables.</p>`,
    },
    {
      slug: 'notre-entrepot-au-coeur-de-votre-supply-chain',
      title: 'Notre entrepôt au cœur de votre supply chain',
      excerpt: 'Comment notre plateforme logistique permet de stocker, préparer et expédier vos commandes en toute sérénité.',
      image: '/images/about-warehouse.jpg',
      content: `<p>Notre entrepôt est conçu pour gérer des volumes variables tout au long de l'année. Nous assurons le stockage, le picking, le conditionnement et l'expédition de vos produits.</p>
<p><strong>Nos atouts :</strong></p>
<ul>
<li>Surface modulable selon vos besoins</li>
<li>Procédures qualité et traçabilité complète</li>
<li>Intégration avec vos outils (e-commerce, ERP)</li>
<li>Équipe dédiée pour les pics d'activité</li>
</ul>
<p>Que vous soyez une marque en croissance ou un acteur établi, nous nous adaptons à votre rythme.</p>`,
    },
    {
      slug: 'equipe-caroline-logistic',
      title: 'L’équipe Caroline Logistic vous accompagne',
      excerpt: 'Présentation des femmes et hommes qui font vivre notre engagement qualité et proximité au quotidien.',
      image: '/images/team.jpg',
      content: `<p>Derrière chaque colis expédié, il y a une équipe passionnée. Nos opérateurs logistiques, nos responsables qualité et nos chargés de compte travaillent main dans la main pour respecter vos délais et vos standards.</p>
<p><strong>Nos valeurs :</strong></p>
<ul>
<li>Proximité et réactivité</li>
<li>Rigueur et traçabilité</li>
<li>Innovation et amélioration continue</li>
</ul>
<p>Rejoignez-nous pour découvrir comment nous pouvons soutenir votre développement.</p>`,
    },
    {
      slug: 'promotions-et-saisonnalite',
      title: 'Promotions et saisonnalité : bien piloter ses stocks',
      excerpt: 'Anticiper les pics de commandes et gérer les opérations promotionnelles sans rupture ni surstock.',
      image: '/images/promo-banner.jpg',
      content: `<p>Les périodes de soldes, Black Friday ou fêtes génèrent des pics d'activité qui mettent à l'épreuve la supply chain. Une bonne préparation et un partage d'informations en amont avec votre prestataire logistique sont essentiels.</p>
<p><strong>Bonnes pratiques :</strong></p>
<ul>
<li>Prévoir les volumes 4 à 6 semaines à l'avance</li>
<li>Renforcer les effectifs et les plages de préparation</li>
<li>Communiquer clairement les délais aux clients</li>
<li>Analyser les données après chaque opération</li>
</ul>
<p>Caroline Logistic vous aide à structurer ces opérations pour des campagnes sereines et performantes.</p>`,
    },
  ]

  for (const post of blogPostsData) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        image: post.image,
        content: post.content,
        isActive: true,
        publishedAt: new Date(),
      },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        image: post.image,
        content: post.content,
        isActive: true,
        publishedAt: new Date(),
      },
    })
  }

  console.log('✅ Created 4 blog posts')

  console.log('🎉 Seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
