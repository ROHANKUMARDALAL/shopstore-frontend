import { Fraunces, Manrope } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { Shell } from "@/components/shell";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata = {
  title: "ShopStore",
  description: "Fertiliser counter stock book. Sign in, add products, stock in, stock out.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable} h-full`}>
      <body className={`${manrope.className} min-h-full bg-background text-foreground antialiased`}>
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
