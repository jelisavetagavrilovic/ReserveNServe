import type { ReactNode } from "react"

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <main className="min-h-screen bg-muted/20">
      <div
        className={`
          mx-auto
          w-full
          max-w-7xl
          px-4
          py-8
          sm:px-6
          md:py-10
          lg:px-8
          ${className}
        `}
      >
        {children}
      </div>
    </main>
  )
}