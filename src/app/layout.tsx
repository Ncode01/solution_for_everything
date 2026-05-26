import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "FlowCanvas",
  description: "Org-wide spatial task management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} bg-[#0E0D0C] font-sans text-on-surface antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
