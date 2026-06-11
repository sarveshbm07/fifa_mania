import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FIFA World Cup Predictor",
  description: "Predict FIFA World Cup match outcomes and earn points",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 antialiased selection:bg-sky-500/30 flex flex-col`}
      >
        <Navigation />
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 flex-1 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
