import type { Metadata } from "next";
import "./globals.css";

const APP_URL = "https://graphiti-jet.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Graphiti — Paint Pixel Art onto Your GitHub Graph",
  description:
    "Design 8-bit pixel art, text banners, and custom patterns, then paint them straight onto your GitHub contribution graph in one click.",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "Graphiti Studio",
    title: "Graphiti — Paint Pixel Art onto Your GitHub Graph",
    description:
      "Design 8-bit pixel art, text banners, and custom patterns, then deploy them onto your GitHub contribution calendar in one click.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Graphiti — Paint Pixel Art onto Your GitHub Graph",
    description:
      "Design 8-bit pixel art & text banners for your GitHub contribution calendar.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0d1117] text-[#f0f6fc] antialiased">
        {children}
      </body>
    </html>
  );
}
