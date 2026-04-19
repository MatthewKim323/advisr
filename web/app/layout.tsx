import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Advisr // Bathysphere-7",
  description:
    "A pixel-art AI counseling submarine that gives every student the team of specialists rich kids hire for $50,000.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
