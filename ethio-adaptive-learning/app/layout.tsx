import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ethio Adaptive Learning",
  description: "A secure, role-aware foundation for Ethiopian adaptive learning workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
