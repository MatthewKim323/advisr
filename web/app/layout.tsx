import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nami // Bathysphere-7",
  description:
    "A pixel-art AI counseling submarine crewed by the Tsunami — a six-specialist team that gives every student what rich kids hire for $50,000.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
