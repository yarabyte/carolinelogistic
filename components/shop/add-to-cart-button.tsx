"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/components/shop/cart-context"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface AddToCartButtonProps {
  productId: string
  title: string
  price: number
  image?: string
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
}

export function AddToCartButton({
  productId,
  title,
  price,
  image,
  size = "lg",
  className = "",
  disabled = false,
}: AddToCartButtonProps) {
  const { addItem } = useCart()
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = () => {
    if (disabled || isAdding) return

    setIsAdding(true)
    
    addItem({
      productId,
      title,
      price,
      image,
      quantity: 1,
    })

    // Afficher une notification
    toast({
      variant: "success",
      title: "Produit ajouté",
      description: `${title} a été ajouté au panier`,
    })

    // Animation feedback
    setTimeout(() => {
      setIsAdding(false)
    }, 300)
  }

  return (
    <Button
      size={size}
      className={`flex-1 bg-primary hover:bg-primary/90 text-primary-foreground ${className}`}
      onClick={handleAddToCart}
      disabled={disabled || isAdding}
    >
      <ShoppingCart className="w-5 h-5 mr-2" />
      {isAdding ? "Ajouté !" : "Ajouter au panier"}
    </Button>
  )
}
