import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Disclaimer } from "./components/Disclaimer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhenToBoat — Know When and Where to Go",
  description:
    "Activity-specific comfort scores for kayakers, sailors, and powerboaters on San Francisco Bay. Live forecasts, tidal currents, and safety-first planning.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://whentoboat.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "WhenToBoat — Know When and Where to Go",
    description:
      "Live comfort scores for kayaking, sailing, and powerboating on SF Bay. 7-day forecast, tidal currents, and 37 destinations scored 1-10.",
    type: "website",
    siteName: "WhenToBoat",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhenToBoat — Know When and Where to Go",
    description:
      "Live comfort scores for kayaking, sailing, and powerboating on SF Bay.",
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "boating conditions",
    "kayaking SF Bay",
    "sailing conditions San Francisco",
    "powerboat weather",
    "tide current forecast",
    "when to kayak",
    "SF Bay boating planner",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0a1628",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-reef-teal focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        {children}
        <Disclaimer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
