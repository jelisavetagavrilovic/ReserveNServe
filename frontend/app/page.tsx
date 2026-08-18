import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"

import { Search } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden">
        <Image
          src="/homePage.jpg"
          alt="Restaurant ambiance"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/50 to-background" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight md:text-6xl">
            Reserve Your Perfect Table
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Discover top restaurants, book tables instantly, and pre-order your meals to enjoy seamless dining without the wait.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/restaurants">
              <Button
                size="lg"
                className="w-full rounded-xl sm:w-auto"
              >
                <Search className="mr-2 h-5 w-5" />
                Browse Restaurants
              </Button>
            </Link>

            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-xl bg-background/40 backdrop-blur-sm sm:w-auto"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}