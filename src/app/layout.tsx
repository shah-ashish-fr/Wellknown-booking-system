import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WellKnown Booking",
  description: "Internal hotel booking management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-slate-50 font-sans antialiased text-slate-900" suppressHydrationWarning>
        <Sidebar />
        <main className="md:ml-64 min-h-full p-4 sm:p-6 lg:p-8 pt-20 md:pt-8">{children}</main>
      </body>
    </html>
  );
}
