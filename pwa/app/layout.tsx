import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AbsurderSQL - SQLite Admin Tool",
  description: "Browser-based SQLite database admin tool with zero server setup",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AbsurderSQL",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded">
          Skip to main content
        </a>
        <nav role="navigation" aria-label="Main navigation" className="border-b">
          <div className="container mx-auto px-6 py-3">
            <ul className="flex gap-6">
              <li><a href="/" className="hover:text-primary">Home</a></li>
              <li><a href="/db/query" className="hover:text-primary">Query</a></li>
              <li><a href="/db/schema" className="hover:text-primary">Schema</a></li>
              <li><a href="/db/browse" className="hover:text-primary">Browse</a></li>
              <li><a href="/db/designer" className="hover:text-primary">Designer</a></li>
              <li><a href="/db/search" className="hover:text-primary">Search</a></li>
              <li><a href="/db/columns" className="hover:text-primary">Columns</a></li>
              <li><a href="/db/grep" className="hover:text-primary">Grep</a></li>
              <li><a href="/db/charts" className="hover:text-primary">Charts</a></li>
              <li><a href="/db/dashboard" className="hover:text-primary">Dashboard</a></li>
              <li><a href="/db/diff" className="hover:text-primary">Schema Diff</a></li>
              <li><a href="/db" className="hover:text-primary">Database</a></li>
            </ul>
          </div>
        </nav>
        <main id="main-content" role="main">
          {children}
        </main>
      </body>
    </html>
  );
}
