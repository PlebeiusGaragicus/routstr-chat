import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import { Toaster } from "sonner";
import BitcoinConnectClient from "@/components/bitcoin-connect/BitcoinConnectClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Routstr",
  description: "The future of AI access is permissionless, private, and decentralized",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#181818] text-foreground`}
        suppressHydrationWarning={true}
      >
        <ClientProviders>
          {children}
          <Toaster theme="dark" />
          <BitcoinConnectClient />
        </ClientProviders>
      </body>
    </html>
  );
}
