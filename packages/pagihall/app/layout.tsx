import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pagi Hall — A quiet internet inside a villa",
  description: "Where your digital cloak thinks with you. Powered by CUIDADO Engine.",
  openGraph: {
    title: "Pagi Hall",
    description: "A civic hall for careful, local intelligence.",
    images: ["/pagihall-exterior.jpg"],
  },
  twitter: { 
    card: "summary_large_image",
    title: "Pagi Hall",
    description: "A civic hall for careful, local intelligence.",
    images: ["/pagihall-exterior.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100">{children}</body>
    </html>
  );
}
