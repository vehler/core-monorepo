import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "core-monorepo",
  description: "Hono API + SDK + Next.js starter",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
