import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

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
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-900 text-white">{children}</body>
    </html>
  );
}
