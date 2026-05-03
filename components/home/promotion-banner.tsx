"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Truck, Clock, Sparkles, Gift, Flame } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
          <span className="text-2xl md:text-3xl font-bold text-white tabular-nums">
            {value}
          </span>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white/30 rounded-full animate-pulse" />
      </div>
      <span className="text-xs md:text-sm text-white/70 mt-2 block font-medium uppercase tracking-wider">
        {label}
      </span>
    </div>
  )
}

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = targetDate.getTime()
      const difference = target - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({
          days: days.toString().padStart(2, "0"),
          hours: hours.toString().padStart(2, "0"),
          minutes: minutes.toString().padStart(2, "0"),
          seconds: seconds.toString().padStart(2, "0"),
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return timeLeft
}

/** `promotions` peut être fourni par la page d’accueil pour usage futur ; le bandeau reste générique. */
export function PromotionBanner(_props?: { promotions?: unknown[] }) {
  // Set countdown to 3 days from now
  const [targetDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 3)
    return date
  })
  
  const timeLeft = useCountdown(targetDate)

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Top banners */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Banner 1 - Hot Deals */}
          <div className="group relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
            
            <div className="relative p-8 md:p-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                      <Flame className="w-4 h-4" />
                      Hot Deals
                    </span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    Jusqu&apos;à <span className="text-yellow-300">-50%</span>
                  </h3>
                  <p className="text-white/80 mb-6 max-w-xs text-lg">
                    Sur une sélection de produits électroniques. Offre limitée !
                  </p>
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl group/btn">
                    <Link href="/promotions">
                      Voir les offres
                      <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
                <div className="hidden md:flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full">
                  <Zap className="w-12 h-12 text-yellow-300" />
                </div>
              </div>
            </div>
            
            {/* Decorative */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </div>

          {/* Banner 2 - Free Shipping */}
          <div className="group relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-secondary/80" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
            
            <div className="relative p-8 md:p-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                      <Gift className="w-4 h-4" />
                      Promo Semaine
                    </span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    Livraison <span className="text-emerald-300">Gratuite</span>
                  </h3>
                  <p className="text-white/80 mb-6 max-w-xs text-lg">
                    Pour toute commande supérieure à 50 € cette semaine.
                  </p>
                  <Button asChild size="lg" className="bg-white text-secondary hover:bg-white/90 shadow-xl group/btn">
                    <Link href="/boutique">
                      Commander
                      <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
                <div className="hidden md:flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full">
                  <Truck className="w-12 h-12 text-emerald-300" />
                </div>
              </div>
            </div>
            
            {/* Decorative */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Flash Sale Countdown */}
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#5a8a2a] via-[#6ea935] to-[#8bc34a]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
          
          {/* Content */}
          <div className="relative px-6 py-10 md:px-12 md:py-14">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {/* Left side */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                  <span className="text-white font-semibold">Vente Flash</span>
                  <Clock className="w-4 h-4 text-white/70" />
                </div>
                <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
                  Soldes de Saison
                </h3>
                <p className="text-xl md:text-2xl text-white/90 font-medium">
                  Profitez de <span className="text-yellow-300 font-bold">-40%</span> sur la Mode
                </p>
              </div>

              {/* Countdown */}
              <div className="flex flex-col items-center gap-6">
                <p className="text-white/80 text-sm font-medium uppercase tracking-wider">
                  Se termine dans
                </p>
                <div className="flex items-center gap-3 md:gap-4">
                  <CountdownUnit value={timeLeft.days} label="Jours" />
                  <span className="text-3xl font-bold text-white/50 -mt-6">:</span>
                  <CountdownUnit value={timeLeft.hours} label="Heures" />
                  <span className="text-3xl font-bold text-white/50 -mt-6">:</span>
                  <CountdownUnit value={timeLeft.minutes} label="Min" />
                  <span className="text-3xl font-bold text-white/50 -mt-6 hidden sm:block">:</span>
                  <div className="hidden sm:block">
                    <CountdownUnit value={timeLeft.seconds} label="Sec" />
                  </div>
                </div>
                <Button asChild size="lg" className="bg-white text-[#6ea935] hover:bg-white/90 shadow-2xl font-bold px-8 group/btn">
                  <Link href="/promotions">
                    Découvrir maintenant
                    <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Animated particles */}
          <div className="absolute top-4 left-[10%] w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
          <div className="absolute top-8 left-[25%] w-3 h-3 bg-yellow-300/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          <div className="absolute bottom-6 left-[15%] w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
          <div className="absolute top-6 right-[20%] w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "0.6s" }} />
          <div className="absolute bottom-8 right-[10%] w-3 h-3 bg-yellow-300/30 rounded-full animate-bounce" style={{ animationDelay: "0.8s" }} />
        </div>
      </div>
    </section>
  )
}
