import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Advisr — The Counseling Office",
  description: "A pixel-art AI counseling office for every first-gen student.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
