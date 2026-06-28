import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/ui/header";
import { Providers } from "./providers"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Reserve&Serve - Restaurant Reservations & Pre-ordering",
  description: "Reserve tables at the restaurants, and pre-order your meals."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          ${playfair.variable}
          font-sans antialiased
        `}
      >
        {/* <main className="flex-1">{children}</main> */}
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
