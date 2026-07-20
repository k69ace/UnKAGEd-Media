import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | AI Business Systems for Restaurants & Hospitality`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "restaurant AI software",
    "hospitality automation",
    "catering estimator software",
    "BEO builder",
    "restaurant labor cost calculator",
  ],
  authors: [{ name: site.founder, url: `${site.url}/about` }],
  creator: site.founder,
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: `${site.name} | AI Business Systems for Restaurants & Hospitality`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | AI Business Systems for Restaurants & Hospitality`,
    description: site.description,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  founder: {
    "@type": "Person",
    name: site.founder,
    url: `${site.url}/about`,
  },
  description: site.description,
  email: site.email,
  sameAs: [site.social.linkedin],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <JsonLd data={organizationSchema} />
        {children}
      </body>
    </html>
  );
}
