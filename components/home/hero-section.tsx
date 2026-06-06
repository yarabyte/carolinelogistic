"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Truck, Shield, Headphones, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { resolveImageUrl } from "@/lib/utils/image-url"
import useEmblaCarousel from "embla-carousel-react"

interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  image: string
  ctaText: string | null
  ctaLink: string | null
  badge: string | null
}

export function HeroSection() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 20 })
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch("/api/hero-slides")
        const data = await res.json()
        setSlides(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching hero slides:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSlides()
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    emblaApi.on("select", onSelect)
    onSelect()

    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi])

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  // Auto-play slides
  useEffect(() => {
    if (!emblaApi || slides.length <= 1) return

    const interval = setInterval(() => {
      emblaApi.scrollNext()
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [emblaApi, slides.length])

  // Default slide if no slides from API
  const defaultSlide: HeroSlide = {
    id: "default",
    title: "Découvrez nos Produits de Qualité",
    subtitle: "Nouvelle Collection 2026",
    description: "Caroline Logistic vous propose une sélection de produits premium avec livraison rapide partout en France.",
    image: "/images/hero-shopping.jpg",
    ctaText: "Voir la Boutique",
    ctaLink: "/boutique",
    badge: "-30%",
  }

  const displaySlides = slides.length > 0 ? slides : [defaultSlide]

  if (loading) {
    return (
      <section className="relative bg-gradient-to-br from-muted to-background overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center text-muted-foreground">Chargement...</div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative bg-gradient-to-br from-muted to-background overflow-hidden">
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {displaySlides.map((slide) => (
              <div key={slide.id} className="flex-[0_0_100%] min-w-0">
                <div className="container mx-auto px-4 py-16 md:py-24">
                  <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Content */}
                    <div className="text-center lg:text-left">
                      {slide.badge && (
                        <span className="inline-block px-4 py-1 bg-[#6ea935]/10 text-[#6ea935] text-sm font-medium rounded-full mb-4">
                          {slide.badge}
                        </span>
                      )}
                      {slide.subtitle && !slide.badge && (
                        <span className="inline-block px-4 py-1 bg-[#6ea935]/10 text-[#6ea935] text-sm font-medium rounded-full mb-4">
                          {slide.subtitle}
                        </span>
                      )}
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                        {slide.title}
                      </h1>
                      {slide.description && (
                        <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 text-pretty">
                          {slide.description}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
                        {slide.ctaText && slide.ctaLink && (
                          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Link href={slide.ctaLink}>
                              {slide.ctaText}
                              <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                        {!slide.ctaText && (
                          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Link href="/boutique">
                              Voir la Boutique
                              <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                        <Button asChild variant="outline" size="lg">
                          <Link href="/promotions">Nos Promotions</Link>
                        </Button>
                      </div>
                    </div>

                    {/* Hero Image */}
                    <div className="relative">
                      <div className="aspect-square max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl">
                        <Image
                          src={resolveImageUrl(slide.image)}
                          alt={slide.title}
                          fill
                          className="object-cover"
                          priority={slide.id === displaySlides[0]?.id}
                        />
                      </div>
                      {slide.badge && (
                        <div className="absolute -bottom-4 left-4 bg-card shadow-lg rounded-xl p-4 border border-border">
                          <p className="text-sm font-semibold text-foreground">{slide.badge}</p>
                          <p className="text-xs text-muted-foreground">Sur la première commande</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation arrows - only show if more than 1 slide */}
        {displaySlides.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
              aria-label="Slide précédent"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
              aria-label="Slide suivant"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {displaySlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === selectedIndex ? "bg-primary w-8" : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Aller au slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Livraison Rapide</h3>
              <p className="text-sm text-muted-foreground">Partout en France</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Paiement Sécurisé</h3>
              <p className="text-sm text-muted-foreground">Transactions protégées</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#6ea935]/10 rounded-xl flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6 text-[#6ea935]" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Support 24/7</h3>
              <p className="text-sm text-muted-foreground">Assistance dédiée</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
