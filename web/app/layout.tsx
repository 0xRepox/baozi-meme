import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "BAOZI — claude mints",
  description: "Sign once. Claude mints. 包子 on Solana.",
  icons: {
    icon: "/bao/chill.jpeg",
    apple: "/bao/chill.jpeg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geistMono.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
