import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Store Intelligence",
  description: "Offline retail conversion dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
