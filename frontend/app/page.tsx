import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

import { Search, CalendarCheck, Utensils, CreditCard, Clock, Star, Table } from "lucide-react"

export default function HomePage() {

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/homePage.jpg"
            alt="Restaurant ambiance"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/55 to-background" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Reserve Your Perfect Table
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Discover top restaurants, book tables instantly, and pre-order your meals to enjoy seamless dining without
            the wait.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/restaurants">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Search className="h-5 w-5" />
                Browse Restaurants
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>  
  )
}
