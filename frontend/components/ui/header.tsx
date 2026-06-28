// "use client"

// import Link from "next/link"
// import { useRouter } from "next/navigation"
// import { Button } from "@/components/ui/button"
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu"
// import { User, Calendar, LogOut } from "lucide-react"
// import { authService } from "@/auth/services/auth.service"
// import { useAuth } from "@/auth/hooks/useAuth"

// export function Header() {
//   const router = useRouter()
//   const { user, isAuthenticated } = useAuth()

//   const handleLogout = async () => {
//     await authService.logout()
//     router.push("/")
//   }

//   return (
//     <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
//       <div className="container mx-auto px-4">
//         <div className="flex h-14 items-center justify-between">
//           <Link href="/">
//             <h1 className="text-2xl font-semibold text-foreground">
//               Reserve&Serve
//             </h1>
//           </Link>

//           <div className="hidden md:flex items-center gap-4">
//             {isAuthenticated ? (
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     className="gap-2 bg-transparent"
//                   >
//                     <User className="h-4 w-4" />
//                     <span className="max-w-24 truncate">
//                       {user?.name ?? "Guest"}
//                     </span>
//                   </Button>
//                 </DropdownMenuTrigger>

//                 <DropdownMenuContent align="end" className="w-48">
//                   <DropdownMenuItem asChild>
//                     <Link
//                       href="/account"
//                       className="flex items-center gap-2"
//                     >
//                       <User className="h-4 w-4" />
//                       Account
//                     </Link>
//                   </DropdownMenuItem>

//                   <DropdownMenuItem asChild>
//                     <Link
//                       href="/bookings"
//                       className="flex items-center gap-2"
//                     >
//                       <Calendar className="h-4 w-4" />
//                       My Bookings
//                     </Link>
//                   </DropdownMenuItem>

//                   <DropdownMenuSeparator />

//                   <DropdownMenuItem
//                     onClick={handleLogout}
//                     className="text-destructive"
//                   >
//                     <LogOut className="mr-2 h-4 w-4" />
//                     Log out
//                   </DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             ) : (
//               <div className="flex gap-2">
//                 <Link href="/login">
//                   <Button variant="ghost" size="sm">
//                     Log in
//                   </Button>
//                 </Link>

//                 <Link href="/register">
//                   <Button size="sm">Sign up</Button>
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </header>
//   )
// }

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import {
  User,
  Calendar,
  LogOut,
  Menu,
} from "lucide-react"

import { authService } from "@/auth/services/auth.service"
import { useAuth } from "@/auth/hooks/useAuth"

export function Header() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await authService.logout()
      router.push("/")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            aria-label="Go to homepage"
            className="flex items-center"
          >
            <h1 className="text-2xl font-semibold text-foreground">
              Reserve&Serve
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                  >
                    <User className="h-4 w-4" />
                    <span className="max-w-32 truncate">
                      {user?.name ?? "Guest"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-52"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href="/account"
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Account
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/bookings"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? "Logging out..." : "Log out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>

                <Button asChild size="sm">
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}