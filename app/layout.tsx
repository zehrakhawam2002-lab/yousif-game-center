import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yousif Game Center",
  description: "Game Center Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
