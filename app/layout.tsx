import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FilmSort – Daily Movie Ranking Game",
  description: "Sort 4 movies in order of release date. New theme every day!",
  openGraph: {
    title: "FilmSort",
    description: "Sort 4 movies in order of release date. New theme every day!",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full" style={{ background: "var(--bg)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
