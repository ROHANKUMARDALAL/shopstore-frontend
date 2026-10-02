import { Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { Shell } from "@/components/shell";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans-body",
  weight: ["300", "400", "500", "600"],
});

export const metadata = {
  title: "ShopStore",
  description: "Fertiliser counter with HSN, GST, stock in/out, and e-way bill.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sourceSans.variable} h-full`}>
      <body className={`${sourceSans.className} min-h-full bg-background text-foreground`}>
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
