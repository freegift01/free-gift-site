import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Free Daily Ebooks | 30-Day Crossword Puzzle Series",
  description:
    "Sign up to receive a free crossword puzzle book every day for 30 days. Delivered straight to your inbox!",
  keywords: ["free ebooks", "crossword puzzles", "crossword books", "daily ebooks", "free puzzle books"],
  openGraph: {
    title: "Free Daily Ebooks | 30-Day Crossword Puzzle Series",
    description:
      "Sign up to receive a free crossword puzzle book every day for 30 days!",
    type: "website",
    url: "https://notification.electedbooks.com",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
