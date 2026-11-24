import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JEV Match — підбір фахівця за 3 кроки",
  description:
    "Демо на базі JEV: опишіть скаргу — модель обере категорію, підкатегорію та фахівця й покаже ймовірність відповідності. Без діагнозів і вигаданих порад.",
};

export const viewport: Viewport = {
  themeColor: "#f8f9ff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk" data-scroll-behavior="smooth" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-page text-body">
        {children}
      </body>
    </html>
  );
}
