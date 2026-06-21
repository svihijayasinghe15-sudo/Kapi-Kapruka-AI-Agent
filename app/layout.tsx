import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kapi — Kapruka Shopping Concierge",
  description: "Chat shopping assistant powered by Kapruka",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
