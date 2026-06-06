import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppProviders } from '@/components/providers/app-providers'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// Évite le pré-rendu au build (connexion DB indisponible / timeout pool sur Vercel)
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: 'Caroline Logistic - E-Commerce',
  description: 'Plateforme e-commerce moderne pour vos achats en ligne. Produits de qualité, livraison rapide.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`font-sans antialiased`}>
        <AppProviders>
          {children}
        </AppProviders>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
