import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moments by Bibi — Share Something Beautiful",
  description: "Share photos, videos, and memories with Bibi. A beautiful way to connect and share moments.",
  openGraph: {
    title: "Moments by Bibi",
    description: "Share photos, videos, and memories with Bibi.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
