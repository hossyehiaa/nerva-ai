import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nerva AI — When Your Business Thinks for Itself",
  description:
    "Nerva AI transforms traditional business operations into smart, self-sustaining ecosystems by deploying custom-trained AI agents that automate customer support, lead generation, and complex workflows. B2B AI SaaS Platform & Full-Stack Automation Agency.",
  keywords: [
    "AI automation",
    "business automation",
    "AI agents",
    "WhatsApp AI",
    "lead generation",
    "customer support automation",
    "SaaS",
    "workflow automation",
    "AI chatbot",
    "Nerva AI",
  ],
  authors: [{ name: "Nerva AI" }],
  icons: {
    icon: "/nerva-logo.png",
  },
  openGraph: {
    title: "Nerva AI — When Your Business Thinks for Itself",
    description:
      "Deploy custom-trained AI agents that automate customer support, lead generation, and complex workflows. 24/7 availability, instant responses, zero-friction lead extraction.",
    url: "https://nerva.ai",
    siteName: "Nerva AI",
    type: "website",
    images: [{ url: "/hero-bg.png", width: 1344, height: 768 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nerva AI — When Your Business Thinks for Itself",
    description:
      "Deploy custom-trained AI agents that automate customer support, lead generation, and complex workflows.",
    images: ["/hero-bg.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
