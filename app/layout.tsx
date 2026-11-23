import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Graphiti Studio 🎨 Digital Street Art for GitHub",
  description: "Transform your GitHub contribution calendar into pixel art with surgical Git precision.",
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
