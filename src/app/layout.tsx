import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "차량 부품몰",
  description: "차량 부품 B2B/B2C 쇼핑몰",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body
        className="min-h-full flex flex-col"
        style={{ background: "linear-gradient(135deg, #e8eef7 0%, #f4f7fb 40%, #eef2ff 100%)" }}
      >
        <AuthProvider>
          <Header />
          <main className="flex flex-col flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
