import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Shell } from "@/components/shell";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "ShopStore",
  description: "Fertiliser counter stock book. Stock in, stock out, and what is on hand.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className={`${geist.className} min-h-full bg-background text-foreground antialiased`}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
